export const SYSTEM_STARTING_BALANCE = 213.91;
export const WITHDRAWAL_COOLDOWN_DAYS = 20;
export const VOTE_REWARD_MIN = 0.3;
export const VOTE_REWARD_MAX = 27.0;

export function getRandomReward(): number {
  return Math.random() * (VOTE_REWARD_MAX - VOTE_REWARD_MIN) + VOTE_REWARD_MIN;
}

export function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}
