import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { setupWebSocket } from "./websocket.js";

const app = createApp();
const server = createServer(app);

// Set up WebSocket server: shares the HTTP port and session cookie with Express.
setupWebSocket(server);

server.listen(env.port, () => {
  console.log(`[server] listening on ${env.serverUrl} (tz=${env.appTz})`);
});
