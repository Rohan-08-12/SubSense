const plaidClient = require("../config/plaid.js");
const { Products, CountryCode } = require("plaid");
const prisma = require("../config/database");

const createLinkToken = async (userId) => {
  const res = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId.toString() },
    client_name: "SubscriptionT",
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: "en",
  });

  return res.data.link_token;
};

const exchangePublicToken = async (publicToken, userId) => {
  const res = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const accessToken = res.data.access_token;
  const itemId = res.data.item_id;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plaidAccessToken: accessToken,
      plaidItemId: itemId,
    },
  });

  return { accessToken, itemId };
};

const getAccounts = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });

  if (!user || !user.plaidAccessToken) {
    throw new Error("Plaid access token not found for user");
  }

  const res = await plaidClient.accountsGet({
    access_token: user.plaidAccessToken,
  });

  return res.data.accounts;
};

const syncTransactions = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plaidAccessToken: true },
  });

  if (!user || !user.plaidAccessToken) {
    throw new Error("No bank account connected");
  }

  const response = await plaidClient.transactionsSync({
    access_token: user.plaidAccessToken,
  });

  const addedTransactions = response.data.added;

  for (const txn of addedTransactions) {
    await prisma.transaction.upsert({
      where: { plaidId: txn.transaction_id },
      create: {
        plaidId: txn.transaction_id,
        userId: userId,
        amount: txn.amount,
        date: new Date(txn.date), // Convert to Date
        name: txn.name,
        merchantName: txn.merchant_name, // Don't forget!
        category: txn.category ? txn.category[0] : null, // First category only
        pending: txn.pending,
        rawData: txn, // Store full response
      },
      update: {
        amount: txn.amount,
        pending: txn.pending,
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { lastSyncAt: new Date() },
  });

  return {
    added: addedTransactions.length,
    total: addedTransactions.length,
  };
};

const disconnectBank = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plaidAccessToken: true,
      plaidItemId: true,
    },
  });

  if (!user || !user.plaidAccessToken) {
    throw new Error("No bank account connected");
  }

  // 2. Remove item from Plaid
  try {
    await plaidClient.itemRemove({
      access_token: user.plaidAccessToken,
    });
  } catch (error) {
    console.error("Plaid item removal failed:", error);
  }

  await prisma.transaction.deleteMany({
    where: { userId: userId },
  });

  await prisma.subscription.deleteMany({
    where: { userId: userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      plaidAccessToken: null,
      plaidItemId: null,
      plaidInstitution: null,
      lastSyncAt: null,
    },
  });

  return { success: true, message: "Bank disconnected successfully" };
};

module.exports = {
  createLinkToken,
  exchangePublicToken,
  getAccounts,
  syncTransactions,
  disconnectBank,
};
