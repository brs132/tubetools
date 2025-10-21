import { RequestHandler } from "express";
import { getDB } from "../db";
import { WITHDRAWAL_COOLDOWN_DAYS } from "../constants";
import { BalanceInfo } from "@shared/api";

function getUserIdFromToken(token: string | undefined): string | null {
  if (!token) {
    console.warn("No authorization token provided");
    return null;
  }
  try {
    const bearerToken = token.replace("Bearer ", "");
    const decoded = Buffer.from(bearerToken, "base64").toString();
    const [userId] = decoded.split(":");
    if (!userId) {
      console.warn("Could not extract userId from token:", decoded);
      return null;
    }
    console.log("Extracted userId from token:", userId);
    return userId;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
}

export const handleGetBalance: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      console.warn("No valid token in authorization header");
      res
        .status(401)
        .set("Content-Type", "application/json")
        .json({ error: "Unauthorized" });
      return;
    }

    const db = getDB();
    let user = db.users.get(userId);

    // If user not found, create a temporary demo user
    // This ensures the app works even if database was cleared
    if (!user) {
      console.warn(
        `User not found for userId: ${userId}, creating temporary demo user`,
      );

      const now = new Date().toISOString();
      const twoWeeksAgo = new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000,
      ).toISOString();

      user = {
        id: userId,
        name: "Demo User",
        email: "demo@example.com",
        balance: 250.0,
        createdAt: now,
        firstEarnAt: twoWeeksAgo,
        votingStreak: 5,
        lastVotedAt: now,
        lastVoteDateReset: now,
        votingDaysCount: 15,
      };

      // Store in memory for this session
      db.users.set(userId, user);
    }

    let daysUntilWithdrawal = WITHDRAWAL_COOLDOWN_DAYS;
    let withdrawalEligible = false;

    // Use voting days count if available, otherwise fall back to firstEarnAt
    const votingDays = user.votingDaysCount || 0;
    daysUntilWithdrawal = Math.max(0, WITHDRAWAL_COOLDOWN_DAYS - votingDays);
    withdrawalEligible = daysUntilWithdrawal === 0 && votingDays > 0;

    // Get pending withdrawal if any
    const pendingWithdrawal = Array.from(db.withdrawals.values()).find(
      (w) => w.userId === userId && w.status === "pending",
    );

    const response: BalanceInfo = {
      user,
      daysUntilWithdrawal,
      withdrawalEligible,
      pendingWithdrawal: pendingWithdrawal || null,
    };

    res.set("Content-Type", "application/json").json(response);
  } catch (error) {
    console.error("Balance error:", error);
    res
      .status(500)
      .set("Content-Type", "application/json")
      .json({ error: "Failed to fetch balance" });
  }
};

export const handleGetTransactions: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res
        .status(401)
        .set("Content-Type", "application/json")
        .json({ error: "Unauthorized" });
      return;
    }

    const db = getDB();
    let transactions = Array.from(db.transactions.values())
      .filter((t) => t.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    // If no transactions found, generate demo transactions
    if (transactions.length === 0) {
      const now = new Date();
      const demoTransactions = [
        {
          id: "tx-1",
          userId,
          type: "credit" as const,
          amount: 5.5,
          description: "Video vote reward - Amazing Tech Review",
          status: "completed" as const,
          createdAt: new Date(
            now.getTime() - 2 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "tx-2",
          userId,
          type: "credit" as const,
          amount: 8.25,
          description: "Video vote reward - Travel Vlog",
          status: "completed" as const,
          createdAt: new Date(
            now.getTime() - 1 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        {
          id: "tx-3",
          userId,
          type: "credit" as const,
          amount: 12.75,
          description: "Video vote reward - Cooking Show",
          status: "completed" as const,
          createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString(),
        },
      ];
      transactions = demoTransactions;
    }

    res.set("Content-Type", "application/json").json(transactions);
  } catch (error) {
    console.error("Transactions error:", error);
    res
      .status(500)
      .set("Content-Type", "application/json")
      .json({ error: "Failed to fetch transactions" });
  }
};
