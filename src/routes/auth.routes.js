const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth");

router.post("/register", authController.registerController);
router.post("/login", authController.loginController);
router.get("/me", authenticate, authController.getMeController);

module.exports = router;
