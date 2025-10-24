import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSignup, handleLogin } from "./routes/auth";
import {
  handleGetVideos,
  handleGetVideo,
  handleVote,
  handleGetDailyVotes,
} from "./routes/videos";
import { handleGetBalance, handleGetTransactions } from "./routes/balance";
import {
  handleCreateWithdrawal,
  handleGetWithdrawals,
} from "./routes/withdrawals";
import { seedVideos } from "./db-neon";

// Initialize database on startup
seedVideos().catch((err) => {
  console.error("Failed to seed videos:", err);
});

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Disable compression to avoid stream reading issues
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Example API routes
  app.get(["/ping", "/api/ping"], (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get(["/demo", "/api/demo"], handleDemo);

  // Auth routes
  app.post(["/auth/signup", "/api/auth/signup"], handleSignup);
  app.post(["/auth/login", "/api/auth/login"], handleLogin);

  // Video routes
  app.get(["/videos", "/api/videos"], handleGetVideos);
  app.get(["/videos/:id", "/api/videos/:id"], handleGetVideo);
  app.post(["/videos/:id/vote", "/api/videos/:id/vote"], handleVote);
  app.get(["/daily-votes", "/api/daily-votes"], handleGetDailyVotes);

  // Balance and transaction routes
  app.get(["/balance", "/api/balance"], handleGetBalance);
  app.get(["/transactions", "/api/transactions"], handleGetTransactions);

  // Withdrawal routes
  app.post(["/withdrawals", "/api/withdrawals"], handleCreateWithdrawal);
  app.get(["/withdrawals", "/api/withdrawals"], handleGetWithdrawals);

  return app;
}
