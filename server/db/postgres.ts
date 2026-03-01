import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function connectPostgres(): pg.Pool {
  if (pool) return pool;
  pool = new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  return pool;
}

export function getPool(): pg.Pool {
  if (!pool) throw new Error("PostgreSQL not connected. Call connectPostgres() first.");
  return pool;
}

export async function closePostgres(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
