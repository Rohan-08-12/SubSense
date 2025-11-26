const plaidClient = require("../config/plaid");
const prisma = require("../config/database");

const detectSubscriptions = async (userId) => {
  //  Get user with access token
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });

  //  Call Plaid recurring transactions API
  const res = await plaidClient.transactionsRecurringGet({
    access_token: user.plaidAccessToken,
  });

  // Process outflow streams (subscriptions are money OUT)
  const streams = res.data.outflow_streams;

  //  For each stream, upsert subscription

  const mapFrequency = (frequency) => {
    const map = {
      WEEKLY: "WEEKLY",
      MONTHLY: "MONTHLY",
      ANNUALLY: "YEARLY",
    };
    return map[frequency] || "MONTHLY";
  };

  // Track unique stream IDs to avoid counting duplicates
  const processedStreamIds = new Set();
  let count = 0;
  
  for (const stream of streams) {
    // Skip if we've already processed this stream_id (duplicate in Plaid response)
    if (processedStreamIds.has(stream.stream_id)) {
      console.log(` Skipping duplicate stream_id in Plaid response: ${stream.stream_id}`);
      continue;
    }
    
    // MAP frequency
    const billingCycle = mapFrequency(stream.frequency);

    try {
      // UPSERT subscription - this should prevent duplicates at DB level
      const result = await prisma.subscription.upsert({
        where: { plaidStreamId: stream.stream_id },
        create: {
          plaidStreamId: stream.stream_id,
          userId: userId,
          merchantName: stream.description,
          amount: Math.abs(stream.average_amount.amount),
          currency: stream.average_amount.iso_currency_code || "USD",
          billingCycle: billingCycle,
          status: stream.is_active ? "ACTIVE" : "INACTIVE",
          confidence: 1.0,
          detectionMethod: "plaid_recurring",
        },
        update: {
          amount: Math.abs(stream.average_amount.amount),
          status: stream.is_active ? "ACTIVE" : "INACTIVE",
        },
      });
      
      processedStreamIds.add(stream.stream_id);
      count += 1;
      console.log(` Processed subscription: ${stream.description} (${stream.stream_id})`);
    } catch (error) {
      console.error(` Error upserting subscription ${stream.stream_id}:`, error.message);
      // Continue processing other streams even if one fails
    }
  }
  
  console.log(`🔍 detectSubscriptions: Processed ${count} unique subscriptions from ${streams.length} streams`);
  
  // 5. Return count
  return { detected: count };
};

const getSubscriptions = async (userId, filters = {}) => {
  const where = { userId: userId };
  if (filters.status) {
    // Normalize status to uppercase to match enum
    const statusUpper = filters.status.toUpperCase();
    if (['ACTIVE', 'INACTIVE', 'CANCELLED', 'PRICE_CHANGED', 'TRIAL'].includes(statusUpper)) {
      where.status = statusUpper;
    }
  }

  const orderBy = {};
  if (filters.sortBy) {
    // Map frontend field names to database field names
    const fieldMap = {
      name: 'merchantName',
      amount: 'amount',
      nextBillingDate: 'nextBillingDate',
      status: 'status',
      category: 'category',
      createdAt: 'createdAt',
    };
    const dbField = fieldMap[filters.sortBy] || filters.sortBy;
    orderBy[dbField] = (filters.sortOrder || "asc").toLowerCase();
  }

  const queryOptions = {
    where,
  };
  
  if (Object.keys(orderBy).length > 0) {
    queryOptions.orderBy = orderBy;
  }

  const subscriptions = await prisma.subscription.findMany(queryOptions);
  
  // Deduplicate by plaidStreamId (primary key) or id (fallback)
  // Use a Map to keep track and ensure we only keep the first occurrence
  const uniqueSubscriptions = [];
  const seenStreamIds = new Set();
  const seenIds = new Set();
  const seenMerchantAmounts = new Map(); // Track by merchantName + amount for additional dedup
  
  for (const sub of subscriptions) {
    let shouldAdd = false;
    
    // Primary deduplication by plaidStreamId
    if (sub.plaidStreamId && sub.plaidStreamId.trim() !== '') {
      if (!seenStreamIds.has(sub.plaidStreamId)) {
        seenStreamIds.add(sub.plaidStreamId);
        shouldAdd = true;
      }
    } else {
      // Fallback: deduplicate by id if no plaidStreamId
      if (!seenIds.has(sub.id)) {
        seenIds.add(sub.id);
        // Additional check: if same merchant + amount, skip duplicate
        const merchantKey = `${sub.merchantName}_${sub.amount}`;
        if (!seenMerchantAmounts.has(merchantKey)) {
          seenMerchantAmounts.set(merchantKey, sub.id);
          shouldAdd = true;
        } else {
          // Check if this is a newer subscription (keep the newer one)
          const existingId = seenMerchantAmounts.get(merchantKey);
          const existingIndex = uniqueSubscriptions.findIndex(s => s.id === existingId);
          if (existingIndex >= 0) {
            const existing = uniqueSubscriptions[existingIndex];
            // If this subscription is newer, replace the old one
            if (new Date(sub.createdAt) > new Date(existing.createdAt)) {
              uniqueSubscriptions.splice(existingIndex, 1);
              seenIds.delete(existing.id);
              seenIds.add(sub.id);
              seenMerchantAmounts.set(merchantKey, sub.id);
              shouldAdd = true;
            }
          }
        }
      }
    }
    
    if (shouldAdd) {
      uniqueSubscriptions.push(sub);
    }
  }
  
  console.log(`📋 getSubscriptions: Found ${subscriptions.length} total, ${uniqueSubscriptions.length} unique subscriptions`);
  
  // Transform subscriptions to match frontend expectations
  const transformedSubscriptions = uniqueSubscriptions.map(sub => {
    // Convert Prisma Decimal to number
    const amount = typeof sub.amount === 'object' && sub.amount && typeof sub.amount.toNumber === 'function'
      ? sub.amount.toNumber()
      : Number(sub.amount) || 0;
    
    // Map fields to frontend expectations
    return {
      ...sub,
      name: sub.merchantName, // Frontend expects 'name' instead of 'merchantName'
      amount: amount,
      status: sub.status.toLowerCase(), // Frontend expects lowercase status
      billingCycle: sub.billingCycle.toLowerCase(), // Frontend expects lowercase
    };
  });
  
  if (transformedSubscriptions.length > 0) {
    console.log('📋 Sample subscription:', JSON.stringify({
      id: transformedSubscriptions[0].id,
      name: transformedSubscriptions[0].name,
      amount: transformedSubscriptions[0].amount,
      status: transformedSubscriptions[0].status,
      plaidStreamId: transformedSubscriptions[0].plaidStreamId
    }));
  }
  
  return transformedSubscriptions;
};

const getSubscriptionStats = async (userId) => {
  const allSubscriptions = await prisma.subscription.findMany({
    where: { userId: userId, status: "ACTIVE" },
  });

  // Deduplicate by plaidStreamId (same logic as getSubscriptions)
  const seenStreamIds = new Set();
  const seenIds = new Set();
  const seenMerchantAmounts = new Map();
  const subscriptions = [];
  
  for (const sub of allSubscriptions) {
    let shouldAdd = false;
    
    // Primary deduplication by plaidStreamId
    if (sub.plaidStreamId && sub.plaidStreamId.trim() !== '') {
      if (!seenStreamIds.has(sub.plaidStreamId)) {
        seenStreamIds.add(sub.plaidStreamId);
        shouldAdd = true;
      }
    } else {
      // Fallback: deduplicate by id if no plaidStreamId
      if (!seenIds.has(sub.id)) {
        seenIds.add(sub.id);
        // Additional check: if same merchant + amount, skip duplicate
        const merchantKey = `${sub.merchantName}_${sub.amount}`;
        if (!seenMerchantAmounts.has(merchantKey)) {
          seenMerchantAmounts.set(merchantKey, sub.id);
          shouldAdd = true;
        } else {
          // Check if this is a newer subscription (keep the newer one)
          const existingId = seenMerchantAmounts.get(merchantKey);
          const existingIndex = subscriptions.findIndex(s => s.id === existingId);
          if (existingIndex >= 0) {
            const existing = subscriptions[existingIndex];
            // If this subscription is newer, replace the old one
            if (new Date(sub.createdAt) > new Date(existing.createdAt)) {
              subscriptions.splice(existingIndex, 1);
              seenIds.delete(existing.id);
              seenIds.add(sub.id);
              seenMerchantAmounts.set(merchantKey, sub.id);
              shouldAdd = true;
            }
          }
        }
      }
    }
    
    if (shouldAdd) {
      subscriptions.push(sub);
    }
  }
  
  console.log(`📊 getSubscriptionStats: Found ${allSubscriptions.length} total, ${subscriptions.length} unique active subscriptions`);

  let monthlyTotal = 0;
  const byCategory = {};
  const byCycle = {
    WEEKLY: 0,
    MONTHLY: 0,
    QUARTERLY: 0,
    YEARLY: 0,
  };

  for (const sub of subscriptions) {
    // Convert Prisma Decimal to number
    let monthlyAmount = typeof sub.amount === 'object' && sub.amount && typeof sub.amount.toNumber === 'function'
      ? sub.amount.toNumber() 
      : Number(sub.amount) || 0;
    
    console.log(`Processing subscription: ${sub.merchantName}, amount: ${sub.amount}, type: ${typeof sub.amount}, monthlyAmount: ${monthlyAmount}, billingCycle: ${sub.billingCycle}`);
    
    switch (sub.billingCycle) {
      case "WEEKLY":
        monthlyAmount *= 4;
        byCycle.WEEKLY += 1;
        break;
      case "MONTHLY":
        byCycle.MONTHLY += 1;
        break;
      case "QUARTERLY":
        monthlyAmount /= 3;
        byCycle.QUARTERLY += 1;
        break;
      case "YEARLY":
        monthlyAmount /= 12;
        byCycle.YEARLY += 1;
        break;
    }
    monthlyTotal += monthlyAmount;

    const category = sub.category || "Uncategorized";
    if (!byCategory[category]) {
      byCategory[category] = 0;
    }
    byCategory[category] += monthlyAmount;
  }
  
  console.log(`Stats calculation: ${subscriptions.length} unique subscriptions, monthlyTotal: ${monthlyTotal}, yearlyTotal: ${monthlyTotal * 12}`);
  
  // Find highest subscription
  let highestSubscription = null;
  if (subscriptions.length > 0) {
    const sortedByAmount = [...subscriptions].sort((a, b) => {
      const amountA = typeof a.amount === 'object' && a.amount && typeof a.amount.toNumber === 'function'
        ? a.amount.toNumber()
        : Number(a.amount) || 0;
      const amountB = typeof b.amount === 'object' && b.amount && typeof b.amount.toNumber === 'function'
        ? b.amount.toNumber()
        : Number(b.amount) || 0;
      return amountB - amountA;
    });
    const highest = sortedByAmount[0];
    highestSubscription = {
      name: highest.merchantName,
      amount: typeof highest.amount === 'object' && highest.amount && typeof highest.amount.toNumber === 'function'
        ? highest.amount.toNumber()
        : Number(highest.amount) || 0,
    };
  }
  
  // Get total count (including inactive)
  const allSubscriptionsCount = await prisma.subscription.count({
    where: { userId: userId },
  });
  
  return {
    totalMonthlyCost: monthlyTotal,
    activeCount: subscriptions.length,
    totalCount: allSubscriptionsCount,
    highestSubscription: highestSubscription,
    yearlyTotal: monthlyTotal * 12,
    byCategory: byCategory,
    byCycle: byCycle,
  };
};

const updateSubscription = async (userId, subscriptionId, updateData) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId: userId,
    },
  });
  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // Transform frontend field names to database field names
  const transformedData = { ...updateData };
  if (transformedData.name) {
    transformedData.merchantName = transformedData.name;
    delete transformedData.name;
  }
  
  // Normalize status to uppercase if provided
  if (transformedData.status) {
    const statusUpper = transformedData.status.toUpperCase();
    if (['ACTIVE', 'INACTIVE', 'CANCELLED', 'PRICE_CHANGED', 'TRIAL'].includes(statusUpper)) {
      transformedData.status = statusUpper;
    }
  }

  const updatedSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: transformedData,
  });
  
  // Transform response to match frontend expectations
  const amount = typeof updatedSubscription.amount === 'object' && updatedSubscription.amount && typeof updatedSubscription.amount.toNumber === 'function'
    ? updatedSubscription.amount.toNumber()
    : Number(updatedSubscription.amount) || 0;
  
  return {
    ...updatedSubscription,
    name: updatedSubscription.merchantName,
    amount: amount,
    status: updatedSubscription.status.toLowerCase(),
    billingCycle: updatedSubscription.billingCycle.toLowerCase(),
  };
};

const deleteSubscription = async (userId, subscriptionId) => {
  const subscription = await prisma.subscription.findFirst({
    where: {
      id: subscriptionId,
      userId: userId,
    },
  });
  if (!subscription) {
    throw new Error("Subscription not found");
  }
  await prisma.subscription.delete({
    where: { id: subscriptionId },
  });

  return { success: true, message: "Subscription deleted successfully" };
};

module.exports = {
  detectSubscriptions,
  getSubscriptions,
  getSubscriptionStats,
  updateSubscription,
  deleteSubscription,
};
