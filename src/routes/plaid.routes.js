const express = require("express");
const router = express.Router();
const {
  createLinkTokenController,
  exchangePublicTokenController,
  getAccountsController,
  syncTransactionsController,
  disconnectController,
} = require("../controllers/plaid.controller");
const authenticate = require("../middleware/auth");

router.post("/link-token", authenticate, createLinkTokenController);
router.post(
  "/exchange-public-token",
  authenticate,
  exchangePublicTokenController
);
router.get("/accounts", authenticate, getAccountsController);
router.post("/sync-transactions", authenticate, syncTransactionsController);
router.delete("/disconnect", authenticate, disconnectController);

module.exports = router;
