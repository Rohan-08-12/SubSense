const plaidService = require("../services/plaid.service");

const createLinkTokenController = async (req, res) => {
  try {
    const userId = req.user.id;
    const linkToken = await plaidService.createLinkToken(userId);
    return res.status(200).json({
      success: true,
      data: { linkToken },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const exchangePublicTokenController = async (req, res) => {
  try {
    const { publicToken } = req.body;
    if (!publicToken) {
      return res.status(400).json({
        success: false,
        error: "Public token is required",
      });
    }
    const userId = req.user.id;
    const result = await plaidService.exchangePublicToken(publicToken, userId);
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const getAccountsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await plaidService.getAccounts(userId);
    return res.status(200).json({
      success: true,
      data: accounts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const syncTransactionsController = async (req, res) => {
  try {
    const userId = req.user.id;
    await plaidService.syncTransactions(userId);
    return res.status(200).json({
      success: true,
      data: "Transactions synced successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const disconnectController = async (req, res) => {
  try {
    const userId = req.user.id;
    await plaidService.disconnectBank(userId);
    return res.status(200).json({
      success: true,
      data: "Disconnected from Plaid successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = {
  createLinkTokenController,
  exchangePublicTokenController,
  getAccountsController,
  syncTransactionsController,
  disconnectController,
};
