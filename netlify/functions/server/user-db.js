"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadUserData = loadUserData;
exports.saveUserData = saveUserData;
exports.createUser = createUser;
exports.getUserByEmail = getUserByEmail;
exports.updateUserProfile = updateUserProfile;
exports.addVote = addVote;
exports.addTransaction = addTransaction;
exports.addWithdrawal = addWithdrawal;
exports.getDailyVoteCount = getDailyVoteCount;
exports.getPendingWithdrawal = getPendingWithdrawal;
exports.getVotedVideoIds = getVotedVideoIds;
exports.generateId = generateId;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const USERS_DIR = path.join(process.cwd(), "users");
function ensureUsersDir() {
    if (!fs.existsSync(USERS_DIR)) {
        try {
            fs.mkdirSync(USERS_DIR, { recursive: true });
        }
        catch (err) {
            console.error("Could not create users directory:", err);
        }
    }
}
function getFilePath(email) {
    // Sanitize email for use as filename
    const sanitized = email.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
    return path.join(USERS_DIR, `${sanitized}.json`);
}
function createEmptyUserData(profile) {
    return {
        profile,
        votes: [],
        transactions: [],
        withdrawals: [],
        dailyVoteCount: { count: 0, date: new Date().toISOString().split("T")[0] },
    };
}
function loadUserData(email) {
    try {
        ensureUsersDir();
        const filePath = getFilePath(email);
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    }
    catch (err) {
        console.error(`Could not load user data for ${email}:`, err);
        return null;
    }
}
function saveUserData(email, userData) {
    try {
        ensureUsersDir();
        const filePath = getFilePath(email);
        fs.writeFileSync(filePath, JSON.stringify(userData, null, 2), "utf-8");
        return true;
    }
    catch (err) {
        console.error(`Could not save user data for ${email}:`, err);
        return false;
    }
}
function createUser(id, name, email, initialBalance = 213.19) {
    const now = new Date().toISOString();
    const profile = {
        id,
        name,
        email,
        balance: initialBalance,
        createdAt: now,
        firstEarnAt: null,
        votingStreak: 0,
        lastVotedAt: null,
        lastVoteDateReset: null,
        votingDaysCount: 0,
    };
    const userData = createEmptyUserData(profile);
    saveUserData(email, userData);
    return userData;
}
function getUserByEmail(email) {
    return loadUserData(email);
}
function updateUserProfile(email, profile) {
    const userData = loadUserData(email);
    if (!userData) {
        return null;
    }
    userData.profile = profile;
    saveUserData(email, userData);
    return userData;
}
function addVote(email, vote) {
    const userData = loadUserData(email);
    if (!userData) {
        return null;
    }
    userData.votes.push(vote);
    userData.profile.lastVotedAt = vote.createdAt;
    // Update daily vote count
    const today = new Date().toISOString().split("T")[0];
    if (userData.dailyVoteCount.date === today) {
        userData.dailyVoteCount.count += 1;
    }
    else {
        userData.dailyVoteCount = { count: 1, date: today };
    }
    saveUserData(email, userData);
    return userData;
}
function addTransaction(email, transaction) {
    const userData = loadUserData(email);
    if (!userData) {
        return null;
    }
    userData.transactions.push(transaction);
    // Update balance if it's a credit
    if (transaction.type === "credit") {
        userData.profile.balance += transaction.amount;
    }
    else if (transaction.type === "debit") {
        userData.profile.balance = Math.max(0, userData.profile.balance - transaction.amount);
    }
    saveUserData(email, userData);
    return userData;
}
function addWithdrawal(email, withdrawal) {
    const userData = loadUserData(email);
    if (!userData) {
        return null;
    }
    userData.withdrawals.push(withdrawal);
    saveUserData(email, userData);
    return userData;
}
function getDailyVoteCount(email) {
    const userData = loadUserData(email);
    if (!userData) {
        return 0;
    }
    const today = new Date().toISOString().split("T")[0];
    if (userData.dailyVoteCount.date === today) {
        return userData.dailyVoteCount.count;
    }
    return 0;
}
function getPendingWithdrawal(email) {
    const userData = loadUserData(email);
    if (!userData) {
        return null;
    }
    return userData.withdrawals.find((w) => w.status === "pending") || null;
}
function getVotedVideoIds(email) {
    const userData = loadUserData(email);
    if (!userData) {
        return [];
    }
    return userData.votes.map((v) => v.videoId);
}
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
