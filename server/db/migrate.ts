import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectPostgres, closePostgres } from "./postgres.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

async function migrate(): Promise<void> {
  const pool = connectPostgres();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const { rows: applied } = await pool.query("SELECT name FROM _migrations ORDER BY id");
  const appliedNames = new Set(applied.map((r) => r.name as string));

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (appliedNames.has(file)) {
      console.log(`  skip: ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await pool.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await pool.query("COMMIT");
      console.log(`  applied: ${file}`);
    } catch (err) {
      await pool.query("ROLLBACK");
      throw err;
    }
  }

  await closePostgres();
  console.log("Migration complete.");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
