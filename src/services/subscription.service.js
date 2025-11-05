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

  let count = 0;
  for (const stream of streams) {
    // MAP frequency
    const billingCycle = mapFrequency(stream.frequency);

    // UPSERT subscription
    await prisma.subscription.upsert({
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
    count += 1;
  }
  // 5. Return count
  return { detected: count };
};

const getSubscriptions = async (userId, filters = {}) => {
  const where = { userId: userId };
  if (filters.status) {
    where.status = filters.status;
  }

  const orderBy = {};
  if (filters.sortBy) {
    orderBy[filters.sortBy] = filters.sortOrder || "asc";
  }

  const subscriptions = await prisma.subscription.findMany({
    where,
    orderBy,
  });
  return subscriptions;
};

const getSubscriptionStats = async (userId) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId: userId, status: "ACTIVE" },
  });

  let monthlyTotal = 0;
  const byCategory = {};
  const byCycle = {
    WEEKLY: 0,
    MONTHLY: 0,
    QUARTERLY: 0,
    YEARLY: 0,
  };

  for (const sub of subscriptions) {
    let monthlyAmount = sub.amount;
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
  return {
    totalActive: subscriptions.length,
    monthlyTotal: monthlyTotal,
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

  const updateSubscription = await prisma.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
  });
  return updateSubscription;
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
