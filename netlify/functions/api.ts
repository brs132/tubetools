import { Handler } from "@netlify/functions";
import { createServer } from "../../server";

let app: any;

try {
  app = createServer();
} catch (error) {
  console.error("Failed to create server:", error);
}

export const handler: Handler = async (event, context) => {
  try {
    return await new Promise((resolve) => {
      if (!app) {
        resolve({
          statusCode: 500,
          body: JSON.stringify({ error: "Server not initialized" }),
        });
        return;
      }

      const req = {
        method: event.httpMethod,
        url: event.path,
        headers: event.headers,
        body: event.body,
      };

      const res = {
        statusCode: 200,
        headers: {} as Record<string, string>,
        body: "",
      };

      // Handle the request
      app(req, res);

      resolve({
        statusCode: res.statusCode || 200,
        headers: res.headers,
        body: res.body,
      });
    });
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
