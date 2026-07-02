import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Proxy API/auth/websocket traffic to the Express server so the browser talks to a single
// origin (localhost:5173). This keeps the session cookie first-party in development.
const SERVER = "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: SERVER, changeOrigin: true },
      "/auth": { target: SERVER, changeOrigin: true },
      "/ws": { target: SERVER, changeOrigin: true, ws: true },
    },
  },
});
