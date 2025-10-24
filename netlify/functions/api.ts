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
  const path = event.path || "";
  const method = event.httpMethod || "GET";

  // Mock Express-like request and response objects
  const req: any = {
    method,
    path,
    url: path,
    headers: event.headers || {},
    query: event.queryStringParameters || {},
    params: event.pathParameters || {},
    body: event.body ? JSON.parse(event.body) : {},
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
    // Route handling
    if (path === "/ping" && method === "GET") {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: process.env.PING_MESSAGE || "ping" }),
      };
    }

    if (path === "/demo" && method === "GET") {
      await handleDemo(req, res);
    } else if (path === "/auth/signup" && method === "POST") {
      await handleSignup(req, res);
    } else if (path === "/auth/login" && method === "POST") {
      await handleLogin(req, res);
    } else if (path === "/videos" && method === "GET") {
      await handleGetVideos(req, res);
    } else if (path.match(/^\/videos\/[^/]+$/) && method === "GET") {
      await handleGetVideo(req, res);
    } else if (path.match(/^\/videos\/[^/]+\/vote$/) && method === "POST") {
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
      res.status(404).json({ error: "Not found" });
    }

    return {
      statusCode: res.statusCode,
      headers: res.headers,
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
