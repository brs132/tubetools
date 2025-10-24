import { RequestHandler } from "express";
import { getDB } from "../db";
import { getRandomReward, roundToTwoDecimals } from "../constants";
import { VoteResponse } from "@shared/api";
import {
  getUserByEmail,
  updateUserProfile,
  addVote,
  addTransaction,
  getDailyVoteCount,
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

export const handleGetVideos: RequestHandler = (req, res) => {
  try {
    const db = getDB();
    const videos = Array.from(db.videos.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json(videos);
  } catch (error) {
    console.error("Videos error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
};

export const handleGetDailyVotes: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const email = getEmailFromToken(token);

    if (!email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userData = getUserByEmail(email);

    if (!userData) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const dailyVotes = getDailyVoteCount(email);
    const remaining = Math.max(0, 7 - dailyVotes);

    // Get total votes for this user (all time)
    const totalVotes = userData.votes.length;
    const votedToday = dailyVotes;
    const remainingVotes = remaining;

    res.json({
      remaining: remainingVotes,
      voted: votedToday,
      totalVotes,
    });
  } catch (error) {
    console.error("Daily votes error:", error);
    res.status(500).json({ error: "Failed to fetch daily votes" });
  }
};

export const handleGetVideo: RequestHandler = (req, res) => {
  try {
    const { id } = req.params;
    const db = getDB();
    const video = db.videos.get(id);

    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    res.json({
      ...video,
      duration: video.duration || 180,
    });
  } catch (error) {
    console.error("Video error:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
};

export const handleVote: RequestHandler = (req, res) => {
  try {
    const token = req.headers.authorization;
    const email = getEmailFromToken(token);

    if (!email) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { id } = req.params;
    const { voteType } = req.body;

    if (!voteType || !["like", "dislike"].includes(voteType)) {
      res.status(400).json({ error: "Invalid vote type" });
      return;
    }

    const db = getDB();
    const video = db.videos.get(id);

    // If video not found, return error
    if (!video) {
      res.status(404).json({ error: "Video not found" });
      return;
    }

    let userData = getUserByEmail(email);

    // User should exist at this point (already logged in)
    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userData.profile;
    const now = new Date();

    // Calculate hours since last reset
    const lastReset = user.lastVoteDateReset
      ? new Date(user.lastVoteDateReset)
      : null;
    const hoursSinceReset = lastReset
      ? (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60)
      : 24;

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
    const dailyVotes = getDailyVoteCount(email);
    if (dailyVotes >= 7) {
      res.status(400).json({
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
      videoId: id,
      voteType: voteType as "like" | "dislike",
      rewardAmount: reward,
      createdAt: nowISO,
    };

    // Add vote to user data
    addVote(email, vote);

    // Update user profile
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

    // Update profile in database
    updateUserProfile(email, user);

    // Create transaction record
    const transactionId = generateId();
    const transaction = {
      id: transactionId,
      type: "credit" as const,
      amount: reward,
      description: `Video vote reward - ${video.title}`,
      status: "completed" as const,
      createdAt: nowISO,
    };

    // Add transaction
    addTransaction(email, transaction);

    const dailyVotesRemaining = 7 - (dailyVotes + 1);

    const response: VoteResponse = {
      vote,
      newBalance,
      dailyVotesRemaining,
      rewardAmount: reward,
      votingStreak: user.votingStreak || 0,
      votingDaysCount: user.votingDaysCount || 0,
    };

    res.json(response);
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ error: "Failed to process vote" });
  }
};
