import { createServer } from "../server";
import { IncomingMessage, ServerResponse } from "http";

const app = createServer();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
