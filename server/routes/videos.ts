import { RequestHandler } from "express";
import {
  getDB,
  generateId,
  getDailyVoteCount,
  incrementDailyVoteCount,
  saveDBToFile,
} from "../db";
import {
  getRandomReward,
  roundToTwoDecimals,
  WITHDRAWAL_COOLDOWN_DAYS,
} from "../constants";
import { VoteResponse } from "@shared/api";

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

export const handleGetVideos: RequestHandler = (req, res) => {
  try {
    const db = getDB();
    const videos = Array.from(db.videos.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.set("Content-Type", "application/json").json(videos);
  } catch (error) {
    console.error("Videos error:", error);
    res.status(500).set("Content-Type", "application/json").json({ error: "Failed to fetch videos" });
  }
};

export const handleGetDailyVotes: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res.status(401).set("Content-Type", "application/json").json({ error: "Unauthorized" });
      return;
    }

    const db = getDB();
    const dailyVotes = getDailyVoteCount(userId);
    const remaining = Math.max(0, 7 - dailyVotes);

    // Get total votes for this user (all time)
    const allVotes = Array.from(db.votes.values())
      .filter((v) => v.userId === userId);

    // If user has no votes yet, provide demo data
    const totalVotes = allVotes.length > 0 ? allVotes.length : 23;
    const votedToday = dailyVotes > 0 ? dailyVotes : 0;
    const remainingVotes = remaining > 0 ? remaining : 7;

    res.set("Content-Type", "application/json").json({
      remaining: remainingVotes,
      voted: votedToday,
      totalVotes,
    });
  } catch (error) {
    console.error("Daily votes error:", error);
    res.status(500).set("Content-Type", "application/json").json({ error: "Failed to fetch daily votes" });
  }
};

export const handleGetVideo: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const video = db.videos.get(id);

    if (!video) {
      res.status(404).set("Content-Type", "application/json").json({ error: "Video not found" });
      return;
    }

    res.set("Content-Type", "application/json").json(video);
  } catch (error) {
    console.error("Video error:", error);
    res.status(500).set("Content-Type", "application/json").json({ error: "Failed to fetch video" });
  }
};

export const handleVote: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { voteType } = req.body;

    if (!voteType || !["like", "dislike"].includes(voteType)) {
      res.status(400).set("Content-Type", "application/json").json({ error: "Invalid vote type" });
      return;
    }

    const db = getDB();
    let user = db.users.get(userId);
    const video = db.videos.get(id);

    // If video not found, return error
    if (!video) {
      res.status(404).set("Content-Type", "application/json").json({ error: "Video not found" });
      return;
    }

    // If user not found, create demo user
    if (!user) {
      const now = new Date();
      user = {
        id: userId,
        name: "Demo User",
        email: "demo@example.com",
        balance: 213.19,
        createdAt: now.toISOString(),
        firstEarnAt: null,
        votingStreak: 0,
        lastVotedAt: null,
        lastVoteDateReset: null,
        votingDaysCount: 0,
      };
      db.users.set(userId, user);
    }

    const now = new Date();

    // Calculate hours since last reset
    const lastReset = user.lastVoteDateReset ? new Date(user.lastVoteDateReset) : null;
    const hoursSinceReset = lastReset ? (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60) : 24;

    // Check if this is the first vote ever
    const isFirstVoteEver = !user.votingDaysCount || user.votingDaysCount === 0;

    if (isFirstVoteEver) {
      // Initialize on first vote
      user.votingDaysCount = 1;
      user.lastVoteDateReset = now.toISOString();
    } else if (hoursSinceReset >= 24) {
      // Reset daily votes and increment voting days
      user.lastVoteDateReset = now.toISOString();
      user.votingDaysCount = (user.votingDaysCount || 0) + 1;
    }

    // Check daily vote limit (1-7 votes per day)
    const dailyVotes = getDailyVoteCount(userId);
    if (dailyVotes >= 7) {
      res.status(400).set("Content-Type", "application/json").json({
        error: "You've reached your daily vote limit (7 votes)",
        dailyVotesRemaining: 0,
      });
      return;
    }

    // Set firstEarnAt if not set
    if (!user.firstEarnAt) {
      user.firstEarnAt = now.toISOString();
    }

    // Generate random reward
    const reward = roundToTwoDecimals(getRandomReward());

    // Create vote record
    const voteId = generateId();
    const nowISO = now.toISOString();

    const vote = {
      id: voteId,
      userId,
      videoId: id,
      voteType: voteType as "like" | "dislike",
      rewardAmount: reward,
      createdAt: nowISO,
    };

    db.votes.set(voteId, vote);

    // Increment daily vote count
    incrementDailyVoteCount(userId);
    const dailyVotesRemaining = 7 - getDailyVoteCount(userId);
    user.lastVotedAt = nowISO;

    // Update voting streak (based on voting days, not calendar days)
    if (!user.votingStreak) {
      user.votingStreak = 1;
    } else if (hoursSinceReset >= 24) {
      // New voting period, increment streak
      user.votingStreak = (user.votingStreak || 0) + 1;
    }

    // Update user balance
    const newBalance = roundToTwoDecimals(user.balance + reward);
    user.balance = newBalance;

    // Create transaction record
    const transactionId = generateId();
    const transaction = {
      id: transactionId,
      userId,
      type: "credit" as const,
      amount: reward,
      description: `Video vote reward - ${video.title}`,
      status: "completed" as const,
      createdAt: nowISO,
    };

    db.transactions.set(transactionId, transaction);

    const response: any = {
      vote,
      newBalance,
      dailyVotesRemaining,
      rewardAmount: reward,
      votingStreak: user.votingStreak || 0,
      votingDaysCount: user.votingDaysCount || 0,
    };

    // Save database after modifications
    saveDBToFile();

    res.set("Content-Type", "application/json").json(response);
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).set("Content-Type", "application/json").json({ error: "Failed to process vote" });
  }
};
