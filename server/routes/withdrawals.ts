import { RequestHandler } from "express";
import { getDB, generateId, saveDBToFile } from "../db";
import { WITHDRAWAL_COOLDOWN_DAYS, roundToTwoDecimals } from "../constants";

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

export const handleCreateWithdrawal: RequestHandler = (req, res) => {
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

    const { amount, method } = req.body;

    if (!amount || !method) {
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({ error: "Amount and method are required" });
      return;
    }

    const db = getDB();
    let user = db.users.get(userId);

    // If user not found, create demo user
    if (!user) {
      const now = new Date();
      const twoWeeksAgo = new Date(
        Date.now() - 14 * 24 * 60 * 60 * 1000,
      ).toISOString();

      user = {
        id: userId,
        name: "Demo User",
        email: "demo@example.com",
        balance: 250.0,
        createdAt: now.toISOString(),
        firstEarnAt: twoWeeksAgo,
        votingStreak: 5,
        lastVotedAt: now.toISOString(),
        lastVoteDateReset: now.toISOString(),
        votingDaysCount: 15,
      };
      db.users.set(userId, user);
    }

    // Check withdrawal eligibility
    if (!user.firstEarnAt) {
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({ error: "You have not earned any money yet" });
      return;
    }

    const firstEarnDate = new Date(user.firstEarnAt);
    const daysPassed = Math.floor(
      (Date.now() - firstEarnDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysPassed < WITHDRAWAL_COOLDOWN_DAYS) {
      const daysRemaining = WITHDRAWAL_COOLDOWN_DAYS - daysPassed;
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({
          error: `You can withdraw in ${daysRemaining} day(s)`,
        });
      return;
    }

    // Check if user has a pending withdrawal
    const pendingWithdrawal = Array.from(db.withdrawals.values()).find(
      (w) => w.userId === userId && w.status === "pending",
    );

    if (pendingWithdrawal) {
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({ error: "You already have a pending withdrawal" });
      return;
    }

    // Validate amount
    const withdrawAmount = roundToTwoDecimals(parseFloat(amount));
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({ error: "Invalid withdrawal amount" });
      return;
    }

    if (withdrawAmount > user.balance) {
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({ error: "Insufficient balance" });
      return;
    }

    // Create withdrawal request
    const withdrawalId = generateId();
    const now = new Date().toISOString();

    const withdrawal = {
      id: withdrawalId,
      userId,
      amount: withdrawAmount,
      method,
      status: "pending" as const,
      requestedAt: now,
      processedAt: null,
    };

    db.withdrawals.set(withdrawalId, withdrawal);

    // Create transaction record
    const transactionId = generateId();
    const transaction = {
      id: transactionId,
      userId,
      type: "withdrawal" as const,
      amount: withdrawAmount,
      description: `Withdrawal request via ${method}`,
      status: "pending" as const,
      createdAt: now,
    };

    db.transactions.set(transactionId, transaction);

    // Save database after modifications
    saveDBToFile();

    res.set("Content-Type", "application/json").json(withdrawal);
  } catch (error) {
    console.error("Withdrawal error:", error);
    res
      .status(500)
      .set("Content-Type", "application/json")
      .json({ error: "Failed to process withdrawal request" });
  }
};

export const handleGetWithdrawals: RequestHandler = (req, res) => {
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
    const withdrawals = Array.from(db.withdrawals.values())
      .filter((w) => w.userId === userId)
      .sort(
        (a, b) =>
          new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime(),
      );

    res.set("Content-Type", "application/json").json(withdrawals);
  } catch (error) {
    console.error("Withdrawals error:", error);
    res
      .status(500)
      .set("Content-Type", "application/json")
      .json({ error: "Failed to fetch withdrawals" });
  }
};
