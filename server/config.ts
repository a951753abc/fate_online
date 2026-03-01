import dotenv from "dotenv";

dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = Object.freeze({
  port: parseInt(optionalEnv("PORT", "3000"), 10),
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  redisUrl: requireEnv("REDIS_URL"),
  databaseUrl: requireEnv("DATABASE_URL"),
  maxGroups: parseInt(optionalEnv("MAX_GROUPS", "7"), 10),
  minHumanPairs: parseInt(optionalEnv("MIN_HUMAN_PAIRS", "2"), 10),
  isDev: optionalEnv("NODE_ENV", "development") === "development",
});

export type Config = typeof config;
