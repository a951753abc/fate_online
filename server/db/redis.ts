import { Redis } from "ioredis";
import { config } from "../config.js";

let redis: Redis | null = null;

export function connectRedis(): Redis {
  if (redis) return redis;
  redis = new Redis(config.redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
  return redis;
}

export function getRedis(): Redis {
  if (!redis) throw new Error("Redis not connected. Call connectRedis() first.");
  return redis;
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
