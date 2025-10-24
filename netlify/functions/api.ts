import { createServer } from "../../server";

const app = createServer();

export async function handler(event: any, context: any) {
  try {
    // Create a mock request/response for Express
    const mockRes = {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: "",
      json: function (data: any) {
        this.body = JSON.stringify(data);
        return this;
      },
      status: function (code: number) {
        this.statusCode = code;
        return this;
      },
      send: function (data: any) {
        if (typeof data === "object") {
          this.json(data);
        } else {
          this.body = data;
        }
        return this;
      },
      set: function (key: string, value: string) {
        this.headers[key] = value;
        return this;
      },
      end: function () {
        return this;
      },
    };

    const mockReq = {
      method: event.httpMethod,
      path: event.path,
      url: event.path,
      query: event.queryStringParameters || {},
      params: event.pathParameters || {},
      headers: event.headers || {},
      body: event.body ? JSON.parse(event.body) : {},
      get: function (header: string) {
        return this.headers[header.toLowerCase()];
      },
    };

    // Call the Express app
    app(mockReq, mockRes);

    return {
      statusCode: mockRes.statusCode,
      headers: mockRes.headers,
      body: mockRes.body,
    };
  } catch (error) {
    console.error("Handler error:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown",
      }),
    };
  }
}
