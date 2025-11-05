const express = require("express");
const router = express.Router();
const {
  detectSubscriptionsController,
  getSubscriptionsController,
  getSubscriptionStatsController,
  updateSubscriptionController,
  deleteSubscriptionController,
} = require("../controllers/subscription.controller");
const authenticate = require("../middleware/auth");

router.post("/detect", authenticate, detectSubscriptionsController);
router.get("/", authenticate, getSubscriptionsController);
router.get("/stats", authenticate, getSubscriptionStatsController);
router.put("/:id", authenticate, updateSubscriptionController);
router.delete("/:id", authenticate, deleteSubscriptionController);

module.exports = router;
