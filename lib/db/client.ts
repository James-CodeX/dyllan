import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { eventsTable, videosTable } from "@/lib/db/schema";

const tursoUrl = process.env.TURSO_DATABASE_URL;

if (!tursoUrl) {
  throw new Error("Missing TURSO_DATABASE_URL environment variable.");
}

const globalClient = globalThis as {
  __historyTrackerDbClient?: ReturnType<typeof createClient>;
};

const client =
  globalClient.__historyTrackerDbClient ??
  createClient({
    url: tursoUrl,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

if (!globalClient.__historyTrackerDbClient) {
  globalClient.__historyTrackerDbClient = client;
}

export const db = drizzle(client, {
  schema: {
    videosTable,
    eventsTable,
  },
});

let initializePromise: Promise<void> | null = null;

async function executeIgnoreDuplicateColumn(statement: string) {
  try {
    await client.execute(statement);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!message.includes("duplicate column name")) {
      throw error;
    }
  }
}

async function initializeSchema() {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      published_at TEXT NOT NULL,
      transcript TEXT,
      ai_status TEXT NOT NULL DEFAULT 'needs_transcript',
      last_error TEXT,
      last_attempt_at TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_db_id INTEGER NOT NULL,
      event TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(video_db_id) REFERENCES videos(id) ON DELETE CASCADE
    )
  `);

  await client.execute("CREATE INDEX IF NOT EXISTS idx_events_video_db_id ON events(video_db_id)");

  await executeIgnoreDuplicateColumn(
    "ALTER TABLE videos ADD COLUMN ai_status TEXT NOT NULL DEFAULT 'needs_transcript'",
  );
  await executeIgnoreDuplicateColumn("ALTER TABLE videos ADD COLUMN last_error TEXT");
  await executeIgnoreDuplicateColumn("ALTER TABLE videos ADD COLUMN last_attempt_at TEXT");

  await client.execute(`
    UPDATE videos
    SET ai_status =
      CASE
        WHEN processed_at IS NOT NULL THEN 'success'
        WHEN transcript IS NOT NULL THEN 'queued'
        ELSE 'needs_transcript'
      END
    WHERE ai_status IS NULL OR ai_status = ''
  `);
}

export function ensureDbSchema() {
  if (!initializePromise) {
    initializePromise = initializeSchema();
  }

  return initializePromise;
}