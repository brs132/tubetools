import serverless from "serverless-http";
import { createServer } from "../../server";

let app: any;

try {
  app = createServer();
} catch (error) {
  console.error("Failed to initialize server:", error);
  throw error;
}

// The Netlify redirect strips /.netlify/functions/api prefix, so routes arrive without it
export const handler = serverless(app, {
  binary: ["application/octet-stream", "image/*"],
});
