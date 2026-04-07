import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const videosTable = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  videoId: text("video_id").notNull().unique(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  publishedAt: text("published_at").notNull(),
  transcript: text("transcript"),
  aiStatus: text("ai_status").notNull().default("needs_transcript"),
  lastError: text("last_error"),
  lastAttemptAt: text("last_attempt_at"),
  processedAt: text("processed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const eventsTable = sqliteTable("events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  videoDbId: integer("video_db_id")
    .notNull()
    .references(() => videosTable.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  description: text("description").notNull(),
  timestamp: text("timestamp").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});