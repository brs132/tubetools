import serverless from "serverless-http";

import { createServer } from "../../server";

const app = createServer();

// The Netlify redirect strips /.netlify/functions/api prefix, so routes arrive without it
export const handler = serverless(app);
