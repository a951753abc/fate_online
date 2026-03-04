import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { Server as SocketServer } from "socket.io";
import { config } from "./config.js";
import { connectRedis, closeRedis } from "./db/redis.js";
import { connectPostgres, closePostgres } from "./db/postgres.js";
import { setupSocketHandler } from "./socket/handler.js";
import { healthHandler } from "./api/health.js";
import { creatorConfigHandler, creatorSubmitHandler } from "./api/creatorRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: config.isDev
    ? {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
      }
    : undefined,
});

// Middleware
if (config.isDev) {
  app.use(cors({ origin: "http://localhost:5173" }));
}
app.use(express.json());

// API routes
app.get("/api/health", healthHandler);
app.get("/api/creator/config", creatorConfigHandler);
app.post("/api/creator/submit", creatorSubmitHandler);

// Serve static client in production
if (!config.isDev) {
  const clientDist = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Connect databases
connectRedis();
connectPostgres();

// Setup socket handlers
setupSocketHandler(io);

// Start server
server.listen(config.port, () => {
  console.log(`聖杯戰爭 Online server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

// Graceful shutdown
async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  server.close();
  io.close();
  await closeRedis();
  await closePostgres();

  console.log("Server shut down.");
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
