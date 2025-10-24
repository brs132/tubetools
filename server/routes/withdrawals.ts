import { RequestHandler } from "express";
import { WITHDRAWAL_COOLDOWN_DAYS, roundToTwoDecimals } from "../constants";
import {
  getUserByEmail,
  updateUserProfile,
  addWithdrawal,
  addTransaction,
  generateId,
} from "../user-db";

function getEmailFromToken(token: string | undefined): string | null {
  if (!token) return null;
  try {
    const decoded = Buffer.from(
      token.replace("Bearer ", ""),
      "base64",
    ).toString();
    return decoded;
  } catch {
    return null;
  }
}

export const handleCreateWithdrawal: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const email = getEmailFromToken(token);

    if (!email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { amount, method } = req.body;

    if (!amount || !method) {
      res.status(400).json({ error: "Amount and method are required" });
      return;
    }

    const userData = await getUserByEmail(email);

    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userData.profile;

    // Check withdrawal eligibility
    if (!user.firstEarnAt) {
      res.status(400).json({ error: "You have not earned any money yet" });
      return;
    }

    const firstEarnDate = new Date(user.firstEarnAt);
    const daysPassed = Math.floor(
      (Date.now() - firstEarnDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysPassed < WITHDRAWAL_COOLDOWN_DAYS) {
      const daysRemaining = WITHDRAWAL_COOLDOWN_DAYS - daysPassed;
      res.status(400).json({
        error: `You can withdraw in ${daysRemaining} day(s)`,
      });
      return;
    }

    // Check if user has a pending withdrawal
    const pendingWithdrawal = userData.withdrawals.find(
      (w) => w.status === "pending",
    );

    if (pendingWithdrawal) {
      res.status(400).json({ error: "You already have a pending withdrawal" });
      return;
    }

    // Validate amount
    const withdrawAmount = roundToTwoDecimals(parseFloat(amount));
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      res.status(400).json({ error: "Invalid withdrawal amount" });
      return;
    }

    if (withdrawAmount > user.balance) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    // Create withdrawal request
    const withdrawalId = generateId();
    const now = new Date().toISOString();

    const withdrawal = {
      id: withdrawalId,
      amount: withdrawAmount,
      status: "pending" as const,
      requestedAt: now,
    };

    await addWithdrawal(email, withdrawal);

    // Create transaction record
    const transactionId = generateId();
    const transaction = {
      id: transactionId,
      type: "debit" as const,
      amount: withdrawAmount,
      description: `Withdrawal request via ${method}`,
      status: "pending" as const,
      createdAt: now,
    };

    await addTransaction(email, transaction);

    res.json(withdrawal);
  } catch (error) {
    console.error("Withdrawal error:", error);
    res.status(500).json({ error: "Failed to process withdrawal request" });
  }
};

export const handleGetWithdrawals: RequestHandler = async (req, res) => {
  try {
    const token = req.headers.authorization;
    const email = getEmailFromToken(token);

    if (!email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userData = await getUserByEmail(email);

    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const withdrawals = userData.withdrawals.sort(
      (a, b) =>
        new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
    );

    res.json(withdrawals);
  } catch (error) {
    console.error("Withdrawals error:", error);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
};
