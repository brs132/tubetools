import { RequestHandler } from "express";
import { SignupRequest, LoginRequest, AuthResponse } from "@shared/api";
import { getDB, generateId, saveDBToFile } from "../db";
import { SYSTEM_STARTING_BALANCE } from "../constants";

export const handleSignup: RequestHandler = (req, res) => {
  try {
    console.log("Signup request received:", req.body);

    const { name, email } = req.body as SignupRequest;

    if (!name || !email) {
      console.warn("Missing name or email in signup");
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({ error: "Name and email are required" });
      return;
    }

    const db = getDB();

    // Check if email already exists
    if (db.emailToUserId.has(email)) {
      console.warn(`Email already registered: ${email}`);
      res
        .status(400)
        .set("Content-Type", "application/json")
        .json({ error: "Email already registered" });
      return;
    }

    // Create new user
    const userId = generateId();
    const now = new Date().toISOString();
    const user: any = {
      id: userId,
      name,
      email,
      balance: SYSTEM_STARTING_BALANCE,
      createdAt: now,
      firstEarnAt: null,
      votingStreak: 0,
      lastVotedAt: null,
      lastVoteDateReset: null,
      votingDaysCount: 0,
    };

    db.users.set(userId, user);
    db.emailToUserId.set(email, userId);

    try {
      saveDBToFile();
    } catch (saveErr) {
      console.warn("Could not save DB to file (non-fatal):", saveErr);
    }

    console.log(`User created: ${userId} (${email})`);
    console.log(`Total users in DB: ${db.users.size}`);

    const token = Buffer.from(`${userId}:${email}`).toString("base64");

    const response: AuthResponse = {
      user,
      token,
    };

    console.log("Sending signup response for user:", userId);
    res.json(response);
  } catch (error) {
    console.error("Signup error details:", error);
    console.error("Error stack:", (error as Error).stack);
    res
      .status(500)
      .set("Content-Type", "application/json")
      .json({ error: "Signup failed" });
  }
};

export const handleLogin: RequestHandler = (req, res) => {
  try {
    const { email } = req.body as LoginRequest;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const db = getDB();
    const userId = db.emailToUserId.get(email);

    if (!userId) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = db.users.get(userId);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const token = Buffer.from(`${userId}:${email}`).toString("base64");

    const response: AuthResponse = {
      user,
      token,
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};
