import { RequestHandler } from "express";
import { getUserByEmail, getPendingWithdrawal } from "../user-db";
import { WITHDRAWAL_COOLDOWN_DAYS } from "../constants";
import { BalanceInfo } from "@shared/api";

function getEmailFromToken(token: string | undefined): string | null {
  if (!token) {
    console.warn("No authorization token provided");
    return null;
  }
  try {
    const bearerToken = token.replace("Bearer ", "");
    const email = Buffer.from(bearerToken, "base64").toString();
    if (!email) {
      console.warn("Could not extract email from token");
      return null;
    }
    console.log("Extracted email from token:", email);
    return email;
  } catch (err) {
    console.error("Error decoding token:", err);
    return null;
  }
}

export const handleGetBalance: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const email = getEmailFromToken(token);

    if (!email) {
      console.warn("No valid token in authorization header");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userData = getUserByEmail(email);

    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userData.profile;
    let daysUntilWithdrawal = WITHDRAWAL_COOLDOWN_DAYS;
    let withdrawalEligible = false;

    // Use voting days count if available
    const votingDays = user.votingDaysCount || 0;
    daysUntilWithdrawal = Math.max(0, WITHDRAWAL_COOLDOWN_DAYS - votingDays);
    withdrawalEligible = daysUntilWithdrawal === 0 && votingDays > 0;

    // Get pending withdrawal if any
    const pendingWithdrawal = getPendingWithdrawal(email);

    const response: BalanceInfo = {
      user,
      daysUntilWithdrawal,
      withdrawalEligible,
      pendingWithdrawal: pendingWithdrawal || null,
    };

    res.json(response);
  } catch (error) {
    console.error("Balance error:", error);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
};

export const handleGetTransactions: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const email = getEmailFromToken(token);

    if (!email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userData = getUserByEmail(email);

    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const transactions = userData.transactions.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    res.json(transactions);
  } catch (error) {
    console.error("Transactions error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};
