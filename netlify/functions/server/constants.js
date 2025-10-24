"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VOTE_REWARD_MAX = exports.VOTE_REWARD_MIN = exports.WITHDRAWAL_COOLDOWN_DAYS = exports.SYSTEM_STARTING_BALANCE = void 0;
exports.getRandomReward = getRandomReward;
exports.roundToTwoDecimals = roundToTwoDecimals;
exports.SYSTEM_STARTING_BALANCE = 0;
exports.WITHDRAWAL_COOLDOWN_DAYS = 20;
exports.VOTE_REWARD_MIN = 0.3;
exports.VOTE_REWARD_MAX = 27.0;
function getRandomReward() {
    return Math.random() * (exports.VOTE_REWARD_MAX - exports.VOTE_REWARD_MIN) + exports.VOTE_REWARD_MIN;
}
function roundToTwoDecimals(num) {
    return Math.round(num * 100) / 100;
}
