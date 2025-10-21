import serverless from "serverless-http";

import { createServer } from "../../server";

const app = createServer();

export const handler = serverless(app, {
  request(request: any, event: any, context: any) {
    // Netlify passes the path without the function path prefix
    // So we need to preserve the original path
    request.url = `/.netlify/functions/api${request.url}`;
    return request;
  },
});
