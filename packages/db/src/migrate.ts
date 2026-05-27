import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationPath = join(__dirname, "../migrations/001_init.sql");
const sql = await readFile(migrationPath, "utf8");

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  await client.query(sql);
  console.log("Database migrations applied");
} finally {
  await client.end();
}
