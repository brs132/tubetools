"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleVote = exports.handleGetVideo = exports.handleGetDailyVotes = exports.handleGetVideos = void 0;
const db_1 = require("../db");
const constants_1 = require("../constants");
const user_db_1 = require("../user-db");
function getEmailFromToken(token) {
    if (!token)
        return null;
    try {
        const decoded = Buffer.from(token.replace("Bearer ", ""), "base64").toString();
        return decoded;
    }
    catch {
        return null;
    }
}
const handleGetVideos = (req, res) => {
    try {
        const db = (0, db_1.getDB)();
        const videos = Array.from(db.videos.values())
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((video) => ({
            ...video,
            duration: video.duration || 180,
        }));
        res.json(videos);
    }
    catch (error) {
        console.error("Videos error:", error);
        res.status(500).json({ error: "Failed to fetch videos" });
    }
};
exports.handleGetVideos = handleGetVideos;
const handleGetDailyVotes = (req, res) => {
    try {
        const token = req.headers.authorization;
        const email = getEmailFromToken(token);
        if (!email) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const userData = (0, user_db_1.getUserByEmail)(email);
        if (!userData) {
            res.status(401).json({ error: "User not found" });
            return;
        }
        const dailyVotes = (0, user_db_1.getDailyVoteCount)(email);
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
    }
    catch (error) {
        console.error("Daily votes error:", error);
        res.status(500).json({ error: "Failed to fetch daily votes" });
    }
};
exports.handleGetDailyVotes = handleGetDailyVotes;
const handleGetVideo = (req, res) => {
    try {
        const { id } = req.params;
        const db = (0, db_1.getDB)();
        const video = db.videos.get(id);
        if (!video) {
            res.status(404).json({ error: "Video not found" });
            return;
        }
        res.json({
            ...video,
            duration: video.duration || 180,
        });
    }
    catch (error) {
        console.error("Video error:", error);
        res.status(500).json({ error: "Failed to fetch video" });
    }
};
exports.handleGetVideo = handleGetVideo;
const handleVote = (req, res) => {
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
        const db = (0, db_1.getDB)();
        const video = db.videos.get(id);
        // If video not found, return error
        if (!video) {
            res.status(404).json({ error: "Video not found" });
            return;
        }
        let userData = (0, user_db_1.getUserByEmail)(email);
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
        }
        else if (hoursSinceReset >= 24) {
            // Reset daily votes and increment voting days
            user.lastVoteDateReset = now.toISOString();
            user.votingDaysCount = (user.votingDaysCount || 0) + 1;
        }
        // Check daily vote limit (1-7 votes per day)
        const dailyVotes = (0, user_db_1.getDailyVoteCount)(email);
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
        const reward = (0, constants_1.roundToTwoDecimals)((0, constants_1.getRandomReward)());
        // Create vote record
        const voteId = (0, user_db_1.generateId)();
        const nowISO = now.toISOString();
        const vote = {
            id: voteId,
            videoId: id,
            voteType: voteType,
            rewardAmount: reward,
            createdAt: nowISO,
        };
        // Add vote to user data
        (0, user_db_1.addVote)(email, vote);
        // Update user profile
        user.lastVotedAt = nowISO;
        // Update voting streak (based on voting days, not calendar days)
        if (!user.votingStreak) {
            user.votingStreak = 1;
        }
        else if (hoursSinceReset >= 24) {
            // New voting period, increment streak
            user.votingStreak = (user.votingStreak || 0) + 1;
        }
        // Update user balance
        const newBalance = (0, constants_1.roundToTwoDecimals)(user.balance + reward);
        user.balance = newBalance;
        // Update profile in database
        (0, user_db_1.updateUserProfile)(email, user);
        // Create transaction record
        const transactionId = (0, user_db_1.generateId)();
        const transaction = {
            id: transactionId,
            type: "credit",
            amount: reward,
            description: `Video vote reward - ${video.title}`,
            status: "completed",
            createdAt: nowISO,
        };
        // Add transaction
        (0, user_db_1.addTransaction)(email, transaction);
        const dailyVotesRemaining = 7 - (dailyVotes + 1);
        const response = {
            vote,
            newBalance,
            dailyVotesRemaining,
            rewardAmount: reward,
            votingStreak: user.votingStreak || 0,
            votingDaysCount: user.votingDaysCount || 0,
        };
        res.json(response);
    }
    catch (error) {
        console.error("Vote error:", error);
        res.status(500).json({ error: "Failed to process vote" });
    }
};
exports.handleVote = handleVote;
