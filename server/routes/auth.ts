import { RequestHandler } from "express";
import { SignupRequest, LoginRequest, AuthResponse } from "@shared/api";
import { createUser, getUserByEmail, generateId } from "../user-db";
import { SYSTEM_STARTING_BALANCE } from "../constants";

export const handleSignup: RequestHandler = async (req, res) => {
  try {
    console.log("Signup request received with body:", JSON.stringify(req.body));

    const { name, email } = req.body as SignupRequest;

    // Validate input
    if (!name || typeof name !== "string" || !name.trim()) {
      console.warn("Invalid name in signup:", { name });
      res.status(400).json({ error: "Valid name is required" });
      return;
    }

    if (!email || typeof email !== "string" || !email.trim()) {
      console.warn("Invalid email in signup:", { email });
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await getUserByEmail(trimmedEmail);
    if (existingUser) {
      console.warn(`Email already registered: ${trimmedEmail}`);
      res
        .status(400)
        .json({ error: "Email already registered. Please use login instead." });
      return;
    }

    // Create new user
    const userId = generateId();
    console.log(`Creating user: ${userId} with email: ${trimmedEmail}`);
    const userData = await createUser(
      userId,
      name.trim(),
      trimmedEmail,
      SYSTEM_STARTING_BALANCE,
    );

    console.log(`User created successfully: ${userId} (${trimmedEmail})`);

    const token = Buffer.from(`${trimmedEmail}`).toString("base64");

    const response: AuthResponse = {
      user: userData.profile,
      token,
    };

    console.log("Sending signup response for user:", userId);
    res.json(response);
  } catch (error) {
    console.error("Signup error details:", error);
    console.error("Error stack:", (error as Error).stack);
    res.status(500).json({ error: "Signup failed - please try again" });
  }
};

export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body as LoginRequest;

    if (!email || typeof email !== "string" || !email.trim()) {
      console.warn("Invalid email in login");
      res.status(400).json({ error: "Valid email is required" });
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    console.log("Login attempt with email:", trimmedEmail);

    const userData = await getUserByEmail(trimmedEmail);

    if (!userData) {
      console.warn(`User not found: ${trimmedEmail}`);
      res.status(404).json({ error: "User not found. Please sign up first." });
      return;
    }

    const token = Buffer.from(`${trimmedEmail}`).toString("base64");

    const response: AuthResponse = {
      user: userData.profile,
      token,
    };

    console.log("Login successful for user:", trimmedEmail);
    res.json(response);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed - please try again" });
  }
};
