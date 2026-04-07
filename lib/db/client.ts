import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { eventsTable, videosTable } from "@/lib/db/schema";

const dbDir = path.join(process.cwd(), "data");
const dbFile = path.join(dbDir, "app.db");

function createConnection() {
  fs.mkdirSync(dbDir, { recursive: true });
  return new Database(dbFile);
}

const globalDb = globalThis as { __historyTrackerDb?: Database.Database };
const sqlite = globalDb.__historyTrackerDb ?? createConnection();

if (!globalDb.__historyTrackerDb) {
  sqlite.pragma("journal_mode = WAL");
  globalDb.__historyTrackerDb = sqlite;
}

export const db = drizzle(sqlite, {
  schema: {
    videosTable,
    eventsTable,
  },
});

let initialized = false;

export function ensureDbSchema() {
  if (initialized) {
    return;
  }

  sqlite.exec(`
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
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_db_id INTEGER NOT NULL,
      event TEXT NOT NULL,
      description TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(video_db_id) REFERENCES videos(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_video_db_id ON events(video_db_id);
  `);

  const columns = sqlite.prepare("PRAGMA table_info(videos)").all() as Array<{ name: string }>;
  const hasColumn = (name: string) => columns.some((column) => column.name === name);

  if (!hasColumn("ai_status")) {
    sqlite.exec("ALTER TABLE videos ADD COLUMN ai_status TEXT NOT NULL DEFAULT 'needs_transcript'");
  }

  if (!hasColumn("last_error")) {
    sqlite.exec("ALTER TABLE videos ADD COLUMN last_error TEXT");
  }

  if (!hasColumn("last_attempt_at")) {
    sqlite.exec("ALTER TABLE videos ADD COLUMN last_attempt_at TEXT");
  }

  sqlite.exec(`
    UPDATE videos
    SET ai_status =
      CASE
        WHEN processed_at IS NOT NULL THEN 'success'
        WHEN transcript IS NOT NULL THEN 'queued'
        ELSE 'needs_transcript'
      END
    WHERE ai_status IS NULL OR ai_status = '';
  `);

  initialized = true;
}