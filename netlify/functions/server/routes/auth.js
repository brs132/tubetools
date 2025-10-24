"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleLogin = exports.handleSignup = void 0;
const user_db_1 = require("../user-db");
const constants_1 = require("../constants");
const handleSignup = (req, res) => {
    try {
        console.log("Signup request received:", req.body);
        const { name, email } = req.body;
        if (!name || !email) {
            console.warn("Missing name or email in signup");
            res.status(400).json({ error: "Name and email are required" });
            return;
        }
        // Check if email already exists
        const existingUser = (0, user_db_1.getUserByEmail)(email);
        if (existingUser) {
            console.warn(`Email already registered: ${email}`);
            res.status(400).json({ error: "Email already registered" });
            return;
        }
        // Create new user
        const userId = (0, user_db_1.generateId)();
        const userData = (0, user_db_1.createUser)(userId, name, email, constants_1.SYSTEM_STARTING_BALANCE);
        console.log(`User created: ${userId} (${email})`);
        const token = Buffer.from(`${email}`).toString("base64");
        const response = {
            user: userData.profile,
            token,
        };
        console.log("Sending signup response for user:", userId);
        res.json(response);
    }
    catch (error) {
        console.error("Signup error details:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Signup failed" });
    }
};
exports.handleSignup = handleSignup;
const handleLogin = (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            res.status(400).json({ error: "Email is required" });
            return;
        }
        const userData = (0, user_db_1.getUserByEmail)(email);
        if (!userData) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        const token = Buffer.from(`${email}`).toString("base64");
        const response = {
            user: userData.profile,
            token,
        };
        res.json(response);
    }
    catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Login failed" });
    }
};
exports.handleLogin = handleLogin;
