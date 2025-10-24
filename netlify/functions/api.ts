import { handleDemo } from "../../server/routes/demo";
import { handleSignup, handleLogin } from "../../server/routes/auth";
import {
  handleGetVideos,
  handleGetVideo,
  handleVote,
  handleGetDailyVotes,
} from "../../server/routes/videos";
import {
  handleGetBalance,
  handleGetTransactions,
} from "../../server/routes/balance";
import {
  handleCreateWithdrawal,
  handleGetWithdrawals,
} from "../../server/routes/withdrawals";

export async function handler(event: any, context: any) {
  // Log environment and request details
  console.log("[API Handler] DATABASE_URL set:", !!process.env.DATABASE_URL);
  console.log("[API Handler] Environment keys:", Object.keys(process.env).filter(k => !k.includes("SECRET")));

  // Extract path from various possible sources
  let path =
    event.path || event.rawPath || event.requestContext?.http?.path || "";

  console.log(
    `[API Handler] BEFORE processing - path: "${path}", rawPath: "${event.rawPath}", http.path: "${event.requestContext?.http?.path}"`,
  );

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

  // Remove any query strings
  if (path.includes("?")) {
    path = path.split("?")[0];
  }

  const method = event.httpMethod || "GET";

  console.log(
    `[API Handler] AFTER processing - Method: ${method}, Path: ${path}`,
  );
  console.log(`[API Handler] Full event keys:`, Object.keys(event));

  // Mock Express-like request and response objects
  let body = {};
  if (event.body) {
    try {
      body =
        typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch (e) {
      console.error("Failed to parse body:", event.body);
      body = {};
    }
  }

  // Normalize headers to lowercase keys
  const normalizedHeaders: Record<string, string> = {};
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      normalizedHeaders[key.toLowerCase()] = value as string;
    }
  }

  console.log(`[API Handler] Normalized headers:`, normalizedHeaders);

  const req: any = {
    method,
    path,
    url: path,
    headers: normalizedHeaders,
    query: event.queryStringParameters || {},
    params: event.pathParameters || {},
    body,
  };

  const res: any = {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: "",
    json(data: any) {
      this.body = JSON.stringify(data);
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(data: any) {
      if (typeof data === "object") {
        return this.json(data);
      }
      this.body = data;
      return this;
    },
    set(key: string, value: string) {
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

    console.log(
      `[API Handler] Regex matches - videoIdMatch: ${videoIdMatch ? videoIdMatch[1] : "no"}, videoVoteMatch: ${videoVoteMatch ? videoVoteMatch[1] : "no"}`,
    );

    if (videoIdMatch) {
      req.params = { id: videoIdMatch[1] };
    }
    if (videoVoteMatch) {
      req.params = { id: videoVoteMatch[1] };
    }

    // Routes must be checked in correct order - specific before general
    if (path === "/ping" && method === "GET") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: process.env.PING_MESSAGE || "ping" }),
      };
    } else if (path === "/demo" && method === "GET") {
      await handleDemo(req, res);
    } else if (path === "/auth/signup" && method === "POST") {
      console.log("Handling signup with body:", req.body);
      await handleSignup(req, res);
    } else if (path === "/auth/login" && method === "POST") {
      console.log("Handling login with body:", req.body);
      await handleLogin(req, res);
    } else if (path === "/daily-votes" && method === "GET") {
      console.log("Handling daily votes");
      await handleGetDailyVotes(req, res);
    } else if (path === "/balance" && method === "GET") {
      console.log("Handling get balance");
      await handleGetBalance(req, res);
    } else if (path === "/transactions" && method === "GET") {
      console.log("Handling get transactions");
      await handleGetTransactions(req, res);
    } else if (path === "/withdrawals" && method === "POST") {
      console.log("Handling create withdrawal");
      await handleCreateWithdrawal(req, res);
    } else if (path === "/withdrawals" && method === "GET") {
      console.log("Handling get withdrawals");
      await handleGetWithdrawals(req, res);
    } else if (path === "/videos" && method === "GET") {
      console.log("Handling get videos");
      await handleGetVideos(req, res);
    } else if (videoVoteMatch && method === "POST") {
      console.log(
        `[API Handler] Handling vote for video: ${req.params.id} - Regex: ${videoVoteMatch[0]}`,
      );
      await handleVote(req, res);
    } else if (videoIdMatch && method === "GET") {
      console.log(`[API Handler] Handling get video: ${req.params.id}`);
      await handleGetVideo(req, res);
    } else {
      console.log(`[API Handler] Route not found: ${method} ${path}`);
      console.log(
        `[API Handler] videoIdMatch: ${videoIdMatch ? "yes (" + videoIdMatch[0] + ")" : "no"}, videoVoteMatch: ${videoVoteMatch ? "yes (" + videoVoteMatch[0] + ")" : "no"}`,
      );
      console.log(
        `[API Handler] Available routes: /ping, /auth/signup, /auth/login, /videos, /videos/{id}, /videos/{id}/vote, /daily-votes, /balance, /transactions, /withdrawals`,
      );
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
  } catch (error) {
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
