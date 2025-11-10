const subscriptionService = require("../services/subscription.service");

const detectSubscriptionsController = async (req, res) => {
  try {
    // Get userId
    const userId = req.user.id;
    // Call service
    const result = await subscriptionService.detectSubscriptions(userId);
    // Return success with detected count
    return res.status(200).json({
      success: true,
      data: result,
      message: `Detected ${result.detected} subscription${result.detected !== 1 ? 's' : ''}`,
    });
  } catch (error) {
    // Return error
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getSubscriptionsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const filters = {
      status: req.query.status,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const subscriptions = await subscriptionService.getSubscriptions(
      userId,
      filters
    );

    return res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getSubscriptionStatsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await subscriptionService.getSubscriptionStats(userId);
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const updateSubscriptionController = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionId = req.params.id;
    const updateData = req.body;

    const updatedSubscription = await subscriptionService.updateSubscription(
      userId,
      subscriptionId,
      updateData
    );

    return res.status(200).json({
      success: true,
      data: updatedSubscription,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

const deleteSubscriptionController = async (req, res) => {
  try {
    const userId = req.user.id;
    const subscriptionId = req.params.id;

    const result = await subscriptionService.deleteSubscription(
      userId,
      subscriptionId
    );

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

module.exports = {
  detectSubscriptionsController,
  getSubscriptionsController,
  getSubscriptionStatsController,
  updateSubscriptionController,
  deleteSubscriptionController,
};
