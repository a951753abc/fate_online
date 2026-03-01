import type { Request, Response } from "express";
import { getRedis } from "../db/redis.js";
import { getPool } from "../db/postgres.js";

export async function healthHandler(_req: Request, res: Response): Promise<void> {
  const startTime = process.uptime();

  let redisOk = false;
  try {
    const pong = await getRedis().ping();
    redisOk = pong === "PONG";
  } catch {
    // Redis not available
  }

  let postgresOk = false;
  try {
    const { rows } = await getPool().query("SELECT 1");
    postgresOk = rows.length === 1;
  } catch {
    // PostgreSQL not available
  }

  const status = redisOk && postgresOk ? "healthy" : "degraded";
  const statusCode = status === "healthy" ? 200 : 503;

  res.status(statusCode).json({
    status,
    redis: redisOk ? "connected" : "disconnected",
    postgres: postgresOk ? "connected" : "disconnected",
    uptime: Math.floor(startTime),
  });
}
