const express = require("express");
require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const { PrismaClient } = require("@prisma/client");
const rateLimit = require("express-rate-limit");

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

const authRoutes = require("./src/routes/auth.routes");
const plaidRoutes = require("./src/routes/plaid.routes");

app.use(cors());
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for development
  })
);
app.use(express.urlencoded({ extended: true }));

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/plaid", plaidRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the Subscription Tracker API",
    status: "OK",
    version: "1.0.0",
  });
});

app.get("/test", (req, res) => {
  res.json({ message: "Test endpoint is working!" });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message });
});

// Catch unhandled errors
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  process.exit(1);
});

app
  .listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  })
  .on("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });

module.exports = app;
