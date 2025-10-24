import * as fs from "fs";
import * as path from "path";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
  firstEarnAt: string | null;
  votingStreak: number;
  lastVotedAt: string | null;
  lastVoteDateReset: string | null;
  votingDaysCount: number;
}

export interface Vote {
  id: string;
  videoId: string;
  voteType: "like" | "dislike";
  rewardAmount: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  status: "completed" | "pending";
  createdAt: string;
}

export interface Withdrawal {
  id: string;
  amount: number;
  status: "pending" | "completed" | "rejected";
  requestedAt: string;
  completedAt?: string;
}

export interface UserData {
  profile: UserProfile;
  votes: Vote[];
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  dailyVoteCount: { count: number; date: string }; // Rastreia votos do dia
}

const USERS_DIR = path.join(process.cwd(), ".data", "users");

function ensureUsersDir() {
  if (!fs.existsSync(USERS_DIR)) {
    try {
      fs.mkdirSync(USERS_DIR, { recursive: true });
    } catch (err) {
      console.error("Could not create users directory:", err);
    }
  }
}

function getFilePath(email: string): string {
  // Sanitize email for use as filename
  const sanitized = email.toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  return path.join(USERS_DIR, `${sanitized}.json`);
}

function createEmptyUserData(profile: UserProfile): UserData {
  return {
    profile,
    votes: [],
    transactions: [],
    withdrawals: [],
    dailyVoteCount: { count: 0, date: new Date().toISOString().split("T")[0] },
  };
}

export function loadUserData(email: string): UserData | null {
  try {
    ensureUsersDir();
    const filePath = getFilePath(email);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as UserData;
  } catch (err) {
    console.error(`Could not load user data for ${email}:`, err);
    return null;
  }
}

export function saveUserData(email: string, userData: UserData): boolean {
  try {
    ensureUsersDir();
    const filePath = getFilePath(email);
    fs.writeFileSync(filePath, JSON.stringify(userData, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`Could not save user data for ${email}:`, err);
    return false;
  }
}

export function createUser(
  id: string,
  name: string,
  email: string,
  initialBalance: number = 213.19,
): UserData {
  const now = new Date().toISOString();
  const profile: UserProfile = {
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

export function getUserByEmail(email: string): UserData | null {
  return loadUserData(email);
}

export function updateUserProfile(
  email: string,
  profile: UserProfile,
): UserData | null {
  const userData = loadUserData(email);
  if (!userData) {
    return null;
  }

  userData.profile = profile;
  saveUserData(email, userData);
  return userData;
}

export function addVote(email: string, vote: Vote): UserData | null {
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
  } else {
    userData.dailyVoteCount = { count: 1, date: today };
  }

  saveUserData(email, userData);
  return userData;
}

export function addTransaction(
  email: string,
  transaction: Transaction,
): UserData | null {
  const userData = loadUserData(email);
  if (!userData) {
    return null;
  }

  userData.transactions.push(transaction);

  // Update balance if it's a credit
  if (transaction.type === "credit") {
    userData.profile.balance += transaction.amount;
  } else if (transaction.type === "debit") {
    userData.profile.balance = Math.max(0, userData.profile.balance - transaction.amount);
  }

  saveUserData(email, userData);
  return userData;
}

export function addWithdrawal(
  email: string,
  withdrawal: Withdrawal,
): UserData | null {
  const userData = loadUserData(email);
  if (!userData) {
    return null;
  }

  userData.withdrawals.push(withdrawal);
  saveUserData(email, userData);
  return userData;
}

export function getDailyVoteCount(email: string): number {
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

export function getPendingWithdrawal(email: string): Withdrawal | null {
  const userData = loadUserData(email);
  if (!userData) {
    return null;
  }

  return userData.withdrawals.find((w) => w.status === "pending") || null;
}

export function getVotedVideoIds(email: string): string[] {
  const userData = loadUserData(email);
  if (!userData) {
    return [];
  }

  return userData.votes.map((v) => v.videoId);
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
