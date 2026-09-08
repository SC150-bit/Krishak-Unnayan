import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import marketRoutes from "./routes/market.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan("dev"));

// Generic API rate limit — generous for normal use, blocks abusive bursts.
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Tighter limits on the routes most worth protecting: auth (credential
// stuffing / OTP spam) and the AI chat endpoint (LLM cost control).
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
const aiLimiter = rateLimit({ windowMs: 60 * 1000, max: 15, standardHeaders: true, legacyHeaders: false });

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "krishak-unnayan-api" }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/markets", marketRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/subscription", subscriptionRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`[server] Krishak Unnayan API running on port ${PORT}`));
});
