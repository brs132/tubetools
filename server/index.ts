import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleSignup, handleLogin } from "./routes/auth";
import { handleGetVideos, handleGetVideo, handleVote, handleGetDailyVotes } from "./routes/videos";
import { handleGetBalance, handleGetTransactions } from "./routes/balance";
import {
  handleCreateWithdrawal,
  handleGetWithdrawals,
} from "./routes/withdrawals";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Auth routes
  app.post("/api/auth/signup", handleSignup);
  app.post("/api/auth/login", handleLogin);

  // Video routes
  app.get("/api/videos", handleGetVideos);
  app.get("/api/videos/:id", handleGetVideo);
  app.post("/api/videos/:id/vote", handleVote);
  app.get("/api/daily-votes", handleGetDailyVotes);

  // Balance and transaction routes
  app.get("/api/balance", handleGetBalance);
  app.get("/api/transactions", handleGetTransactions);

  // Withdrawal routes
  app.post("/api/withdrawals", handleCreateWithdrawal);
  app.get("/api/withdrawals", handleGetWithdrawals);

  return app;
}
