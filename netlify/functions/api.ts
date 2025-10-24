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
  // Extract path, removing /api prefix if present
  let path = event.path || event.rawPath || "";
  if (path.startsWith("/api")) {
    path = path.slice(4); // Remove /api prefix
  }
  const method = event.httpMethod || "GET";

  console.log(`[API] ${method} ${path}`);

  // Mock Express-like request and response objects
  let body = {};
  if (event.body) {
    try {
      body = typeof event.body === "string" ? JSON.parse(event.body) : event.body;
    } catch (e) {
      console.error("Failed to parse body:", event.body);
      body = {};
    }
  }

  const req: any = {
    method,
    path,
    url: path,
    headers: event.headers || {},
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

    if (videoIdMatch) {
      req.params = { id: videoIdMatch[1] };
    }
    if (videoVoteMatch) {
      req.params = { id: videoVoteMatch[1] };
    }

    if (path === "/demo" && method === "GET") {
      await handleDemo(req, res);
    } else if (path === "/auth/signup" && method === "POST") {
      console.log("Handling signup with body:", req.body);
      await handleSignup(req, res);
    } else if (path === "/auth/login" && method === "POST") {
      console.log("Handling login with body:", req.body);
      await handleLogin(req, res);
    } else if (path === "/videos" && method === "GET") {
      await handleGetVideos(req, res);
    } else if (videoIdMatch && method === "GET") {
      await handleGetVideo(req, res);
    } else if (videoVoteMatch && method === "POST") {
      await handleVote(req, res);
    } else if (path === "/daily-votes" && method === "GET") {
      await handleGetDailyVotes(req, res);
    } else if (path === "/balance" && method === "GET") {
      await handleGetBalance(req, res);
    } else if (path === "/transactions" && method === "GET") {
      await handleGetTransactions(req, res);
    } else if (path === "/withdrawals" && method === "POST") {
      await handleCreateWithdrawal(req, res);
    } else if (path === "/withdrawals" && method === "GET") {
      await handleGetWithdrawals(req, res);
    } else {
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
