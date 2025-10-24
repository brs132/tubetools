import "dotenv/config";
import express from "express";
import cors from "cors";
import serverless from "serverless-http";
import { handleDemo } from "../../server/routes/demo";
import { handleSignup, handleLogin } from "../../server/routes/auth";
import {
  handleGetVideos,
  handleGetVideo,
  handleVote,
  handleGetDailyVotes,
} from "../../server/routes/videos";
import {
  handleGetBalance,
  handleGetTransactions,
} from "../../server/routes/balance";
import {
  handleCreateWithdrawal,
  handleGetWithdrawals,
} from "../../server/routes/withdrawals";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Config
app.disable("x-powered-by");
app.set("trust proxy", 1);

// Routes
app.get("/ping", (_req, res) => {
  const ping = process.env.PING_MESSAGE ?? "ping";
  res.json({ message: ping });
});

app.get("/demo", handleDemo);

// Auth routes
app.post("/auth/signup", handleSignup);
app.post("/auth/login", handleLogin);

// Video routes
app.get("/videos", handleGetVideos);
app.get("/videos/:id", handleGetVideo);
app.post("/videos/:id/vote", handleVote);
app.get("/daily-votes", handleGetDailyVotes);

// Balance routes
app.get("/balance", handleGetBalance);
app.get("/transactions", handleGetTransactions);

// Withdrawal routes
app.post("/withdrawals", handleCreateWithdrawal);
app.get("/withdrawals", handleGetWithdrawals);

export const handler = serverless(app);
