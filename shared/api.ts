/**
 * Shared code between client and server
 * Useful to share types between client and server
 */

// Auth
export interface SignupRequest {
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
}

export interface AuthResponse {
  user: UserData;
  token: string;
}

// User
export interface UserData {
  id: string;
  name: string;
  email: string;
  balance: number;
  createdAt: string;
  firstEarnAt: string | null;
  votingStreak?: number;
  lastVotedAt?: string;
  lastVoteDateReset?: string;
  votingDaysCount?: number;
}

// Videos
export interface Video {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnail: string;
  rewardMin: number;
  rewardMax: number;
  createdAt: string;
  duration?: number;
}

export interface Vote {
  id: string;
  userId: string;
  videoId: string;
  voteType: "like" | "dislike";
  rewardAmount: number;
  createdAt: string;
}

// Transactions
export interface Transaction {
  id: string;
  userId: string;
  type: "credit" | "debit" | "withdrawal" | "withdrawal_reversal";
  amount: number;
  description: string;
  status: "completed" | "pending" | "failed";
  createdAt: string;
}

// Withdrawals
export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  method: string;
  status: "pending" | "approved" | "rejected" | "completed";
  requestedAt: string;
  processedAt: string | null;
}

// Balance info
export interface BalanceInfo {
  user: UserData;
  daysUntilWithdrawal: number;
  withdrawalEligible: boolean;
  pendingWithdrawal: Withdrawal | null;
}

// Voting response
export interface VoteResponse {
  vote: Vote;
  newBalance: number;
  dailyVotesRemaining?: number;
  rewardAmount?: number;
  votingStreak?: number;
  totalVideosWatched?: number;
  votingDaysCount?: number;
}
