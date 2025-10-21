import { RequestHandler } from "express";
import { getDB } from "../db";
import { WITHDRAWAL_COOLDOWN_DAYS } from "../constants";
import { BalanceInfo } from "@shared/api";

function getUserIdFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(
      token.replace("Bearer ", ""),
      "base64",
    ).toString();
    const [userId] = decoded.split(":");
    return userId;
  } catch {
    return null;
  }
}

export const handleGetBalance: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getDB();
    const user = db.users.get(userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
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

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};

export const handleGetTransactions: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const db = getDB();
    const transactions = Array.from(db.transactions.values())
      .filter((t) => t.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
