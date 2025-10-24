import { RequestHandler } from "express";
import { SignupRequest, LoginRequest, AuthResponse } from "@shared/api";
import { createUser, getUserByEmail, generateId } from "../user-db";
import { SYSTEM_STARTING_BALANCE } from "../constants";

export const handleSignup: RequestHandler = (req, res) => {
  try {
    console.log("Signup request received:", req.body);

    const { name, email } = req.body as SignupRequest;

    if (!name || !email) {
      console.warn("Missing name or email in signup");
      res.status(400).json({ error: "Name and email are required" });
      return;
    }

    // Check if email already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      console.warn(`Email already registered: ${email}`);
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    // Create new user
    const userId = generateId();
    const userData = createUser(userId, name, email, SYSTEM_STARTING_BALANCE);

    console.log(`User created: ${userId} (${email})`);

    const token = Buffer.from(`${email}`).toString("base64");

    const response: AuthResponse = {
      user: userData.profile,
      token,
    };

    console.log("Sending signup response for user:", userId);
    res.json(response);
  } catch (error) {
    console.error("Signup error details:", error);
    console.error("Error stack:", (error as Error).stack);
    res.status(500).json({ error: "Signup failed" });
  }
};

export const handleLogin: RequestHandler = (req, res) => {
  try {
    const { email } = req.body as LoginRequest;

    if (!email) {
      res.status(400).json({ error: "Email is required" });
      return;
    }

    const userData = getUserByEmail(email);

    if (!userData) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const token = Buffer.from(`${email}`).toString("base64");

    const response: AuthResponse = {
      user: userData.profile,
      token,
    };

    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
};
