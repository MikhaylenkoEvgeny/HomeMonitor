import pg from "pg";
import { retentionCutoffSql } from "@homemonitor/db";

const databaseUrl = process.env.DATABASE_URL;
const intervalMs = Number.parseInt(process.env.RETENTION_INTERVAL_MS ?? `${1000 * 60 * 60}`, 10);

async function runRetentionOnce(): Promise<void> {
  if (!databaseUrl) {
    console.log("DATABASE_URL is not set; worker is idling");
    return;
  }

  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await client.query(retentionCutoffSql(30));
    console.log("Retention completed");
  } finally {
    await client.end();
  }
}

await runRetentionOnce();
setInterval(() => {
  void runRetentionOnce().catch((error) => {
    console.error("Retention failed", error);
  });
}, intervalMs);
