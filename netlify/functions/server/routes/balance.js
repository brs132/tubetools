"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleGetTransactions = exports.handleGetBalance = void 0;
const user_db_1 = require("../user-db");
const constants_1 = require("../constants");
function getEmailFromToken(token) {
    if (!token) {
        console.warn("No authorization token provided");
        return null;
    }
    try {
        const bearerToken = token.replace("Bearer ", "");
        const email = Buffer.from(bearerToken, "base64").toString();
        if (!email) {
            console.warn("Could not extract email from token");
            return null;
        }
        console.log("Extracted email from token:", email);
        return email;
    }
    catch (err) {
        console.error("Error decoding token:", err);
        return null;
    }
}
const handleGetBalance = (req, res) => {
    try {
        const token = req.headers.authorization;
        const email = getEmailFromToken(token);
        if (!email) {
            console.warn("No valid token in authorization header");
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const userData = (0, user_db_1.getUserByEmail)(email);
        if (!userData) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const user = userData.profile;
        let daysUntilWithdrawal = constants_1.WITHDRAWAL_COOLDOWN_DAYS;
        let withdrawalEligible = false;
        // Use voting days count if available
        const votingDays = user.votingDaysCount || 0;
        daysUntilWithdrawal = Math.max(0, constants_1.WITHDRAWAL_COOLDOWN_DAYS - votingDays);
        withdrawalEligible = daysUntilWithdrawal === 0 && votingDays > 0;
        // Get pending withdrawal if any
        const pendingWithdrawal = (0, user_db_1.getPendingWithdrawal)(email);
        const response = {
            user,
            daysUntilWithdrawal,
            withdrawalEligible,
            pendingWithdrawal: pendingWithdrawal || null,
        };
        res.json(response);
    }
    catch (error) {
        console.error("Balance error:", error);
        res.status(500).json({ error: "Failed to fetch balance" });
    }
};
exports.handleGetBalance = handleGetBalance;
const handleGetTransactions = (req, res) => {
    try {
        const token = req.headers.authorization;
        const email = getEmailFromToken(token);
        if (!email) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const userData = (0, user_db_1.getUserByEmail)(email);
        if (!userData) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const transactions = userData.transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json(transactions);
    }
    catch (error) {
        console.error("Transactions error:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};
exports.handleGetTransactions = handleGetTransactions;
