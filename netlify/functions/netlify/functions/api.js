"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const demo_1 = require("../../server/routes/demo");
const auth_1 = require("../../server/routes/auth");
const videos_1 = require("../../server/routes/videos");
const balance_1 = require("../../server/routes/balance");
const withdrawals_1 = require("../../server/routes/withdrawals");
async function handler(event, context) {
    // Extract path from various possible sources
    let path = event.path || event.rawPath || "";
    // Remove .netlify/functions/api prefix if present
    if (path.includes("/.netlify/functions/api")) {
        path = path.split("/.netlify/functions/api")[1] || "";
    }
    // Remove /api prefix if present
    else if (path.startsWith("/api")) {
        path = path.slice(4);
    }
    // Ensure path starts with /
    if (!path.startsWith("/")) {
        path = "/" + path;
    }
    const method = event.httpMethod || "GET";
    console.log(`[API Handler] Method: ${method}, Path: ${path}, Raw Path: ${event.path}, Raw URL: ${event.rawPath}`);
    console.log(`[API Handler] Full event keys:`, Object.keys(event));
    // Mock Express-like request and response objects
    let body = {};
    if (event.body) {
        try {
            body =
                typeof event.body === "string" ? JSON.parse(event.body) : event.body;
        }
        catch (e) {
            console.error("Failed to parse body:", event.body);
            body = {};
        }
    }
    const req = {
        method,
        path,
        url: path,
        headers: event.headers || {},
        query: event.queryStringParameters || {},
        params: event.pathParameters || {},
        body,
    };
    const res = {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: "",
        json(data) {
            this.body = JSON.stringify(data);
            return this;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        send(data) {
            if (typeof data === "object") {
                return this.json(data);
            }
            this.body = data;
            return this;
        },
        set(key, value) {
            this.headers[key] = value;
            return this;
        },
    };
    try {
        // Handle CORS preflight
        if (method === "OPTIONS") {
            return {
                statusCode: 204,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type,Authorization",
                },
                body: "",
            };
        }
        // Route handling
        if (path === "/ping" && method === "GET") {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: process.env.PING_MESSAGE || "ping" }),
            };
        }
        // Extract ID from path for parameterized routes
        const videoIdMatch = path.match(/^\/videos\/([^/]+)$/);
        const videoVoteMatch = path.match(/^\/videos\/([^/]+)\/vote$/);
        if (videoIdMatch) {
            req.params = { id: videoIdMatch[1] };
        }
        if (videoVoteMatch) {
            req.params = { id: videoVoteMatch[1] };
        }
        if (path === "/demo" && method === "GET") {
            await (0, demo_1.handleDemo)(req, res);
        }
        else if (path === "/auth/signup" && method === "POST") {
            console.log("Handling signup with body:", req.body);
            await (0, auth_1.handleSignup)(req, res);
        }
        else if (path === "/auth/login" && method === "POST") {
            console.log("Handling login with body:", req.body);
            await (0, auth_1.handleLogin)(req, res);
        }
        else if (path === "/videos" && method === "GET") {
            await (0, videos_1.handleGetVideos)(req, res);
        }
        else if (videoIdMatch && method === "GET") {
            await (0, videos_1.handleGetVideo)(req, res);
        }
        else if (videoVoteMatch && method === "POST") {
            await (0, videos_1.handleVote)(req, res);
        }
        else if (path === "/daily-votes" && method === "GET") {
            await (0, videos_1.handleGetDailyVotes)(req, res);
        }
        else if (path === "/balance" && method === "GET") {
            await (0, balance_1.handleGetBalance)(req, res);
        }
        else if (path === "/transactions" && method === "GET") {
            await (0, balance_1.handleGetTransactions)(req, res);
        }
        else if (path === "/withdrawals" && method === "POST") {
            await (0, withdrawals_1.handleCreateWithdrawal)(req, res);
        }
        else if (path === "/withdrawals" && method === "GET") {
            await (0, withdrawals_1.handleGetWithdrawals)(req, res);
        }
        else {
            console.log(`Route not found: ${method} ${path}`);
            res.status(404).json({ error: "Not found" });
        }
        return {
            statusCode: res.statusCode,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type,Authorization",
                ...res.headers,
            },
            body: res.body,
        };
    }
    catch (error) {
        console.error("Handler error:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                error: error instanceof Error ? error.message : "Internal server error",
            }),
        };
    }
}
