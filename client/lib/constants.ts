// System constants
export const SYSTEM_STARTING_BALANCE = 213.19;
export const WITHDRAWAL_COOLDOWN_DAYS = 20;
export const DAILY_GOAL_VIDEO_COUNT = 3;
export const DAILY_CHECKIN_BONUS = 0.5;

// Vote rewards
export const VOTE_REWARD_MIN = 0.3;
export const VOTE_REWARD_MAX = 27.0;

// Video requirements
export const VIDEO_MIN_WATCH_SECONDS = 4;

// Storage keys
export const STORAGE_KEY_USER = "tubetools_user";
export const STORAGE_KEY_TOKEN = "tubetools_token";
export const STORAGE_KEY_EMAIL = "tubetools_email";

// API endpoints
export const API_BASE = "/api";
export const API_AUTH = `${API_BASE}/auth`;
export const API_VIDEOS = `${API_BASE}/videos`;
export const API_BALANCE = `${API_BASE}/balance`;
export const API_TRANSACTIONS = `${API_BASE}/transactions`;
export const API_WITHDRAWALS = `${API_BASE}/withdrawals`;
