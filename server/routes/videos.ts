import { RequestHandler } from "express";
import {
  getDB,
  generateId,
  getDailyVoteCount,
  incrementDailyVoteCount,
} from "../db";
import {
  getRandomReward,
  roundToTwoDecimals,
  WITHDRAWAL_COOLDOWN_DAYS,
} from "../constants";
import { VoteResponse } from "@shared/api";

export const handleGetVideos: RequestHandler = (req, res) => {
  try {
    const db = getDB();
    const videos = Array.from(db.videos.values()).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch videos" });
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

    res.json(video);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video" });
  }
};

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
      res.status(400).json({ error: "Invalid vote type" });
      return;
    }

    const db = getDB();
    const user = db.users.get(userId);
    const video = db.videos.get(id);

    if (!user || !video) {
      res.status(404).json({ error: "User or video not found" });
      return;
    }

    // Check daily vote limit (1-7 votes per day)
    const dailyVotes = getDailyVoteCount(userId);
    if (dailyVotes >= 7) {
      res.status(400).json({
        error: "You've reached your daily vote limit (7 votes)",
        dailyVotesRemaining: 0,
      });
      return;
    }

    // Check if user already voted on this video
    const existingVote = Array.from(db.votes.values()).find(
      (v) => v.userId === userId && v.videoId === id,
    );

    if (existingVote) {
      res.status(400).json({ error: "You have already voted on this video" });
      return;
    }

    // Generate random reward
    const reward = roundToTwoDecimals(getRandomReward());

    // Create vote record
    const voteId = generateId();
    const now = new Date().toISOString();

    const vote = {
      id: voteId,
      userId,
      videoId: id,
      voteType: voteType as "like" | "dislike",
      rewardAmount: reward,
      createdAt: now,
    };

    db.votes.set(voteId, vote);

    // Increment daily vote count
    incrementDailyVoteCount(userId);
    const dailyVotesRemaining = 7 - getDailyVoteCount(userId);

    // Update user balance and set first earn date if needed
    const newBalance = roundToTwoDecimals(user.balance + reward);
    user.balance = newBalance;
    if (!user.firstEarnAt) {
      user.firstEarnAt = now;
    }

    // Create transaction record
    const transactionId = generateId();
    const transaction = {
      id: transactionId,
      userId,
      type: "credit" as const,
      amount: reward,
      description: `Video vote reward - ${video.title}`,
      status: "completed" as const,
      createdAt: now,
    };

    db.transactions.set(transactionId, transaction);

    const response: any = {
      vote,
      newBalance,
      dailyVotesRemaining,
      rewardAmount: reward,
    };

    res.json(response);
  } catch (error) {
    console.error("Vote error:", error);
    res.status(500).json({ error: "Failed to process vote" });
  }
};
