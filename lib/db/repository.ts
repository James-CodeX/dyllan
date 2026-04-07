import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db, ensureDbSchema } from "@/lib/db/client";
import { eventsTable, videosTable } from "@/lib/db/schema";
import type { DetectedEvent, ScanInputVideo, ScannedVideo, StoredEvent } from "@/lib/types";

ensureDbSchema();

type VideoRow = typeof videosTable.$inferSelect;

export function getVideo(videoId: string) {
  return db.select().from(videosTable).where(eq(videosTable.videoId, videoId)).get();
}

export function deleteVideo(videoId: string) {
  const video = getVideo(videoId);

  if (!video) {
    return false;
  }

  db.delete(videosTable).where(eq(videosTable.id, video.id)).run();
  return true;
}

export function upsertVideo(video: ScanInputVideo, transcript: string | null) {
  const existing = getVideo(video.videoId);

  if (existing) {
    db.update(videosTable)
      .set({
        title: video.title,
        url: video.url,
        publishedAt: video.publishedAt,
        transcript: transcript ?? existing.transcript,
        aiStatus: existing.processedAt ? "success" : transcript || existing.transcript ? "queued" : "needs_transcript",
        lastError: null,
      })
      .where(eq(videosTable.id, existing.id))
      .run();

    return getVideo(video.videoId) as VideoRow;
  }

  const created = db
    .insert(videosTable)
    .values({
      videoId: video.videoId,
      title: video.title,
      url: video.url,
      publishedAt: video.publishedAt,
      transcript,
      aiStatus: transcript ? "queued" : "needs_transcript",
      lastError: null,
      lastAttemptAt: null,
      processedAt: null,
    })
    .run();

  return db.select().from(videosTable).where(eq(videosTable.id, Number(created.lastInsertRowid))).get() as VideoRow;
}

export function isVideoProcessed(videoId: string) {
  const video = getVideo(videoId);
  return Boolean(video?.processedAt);
}

export function markVideoProcessed(videoDbId: number) {
  const now = new Date().toISOString();

  db.update(videosTable)
    .set({
      processedAt: now,
      aiStatus: "success",
      lastError: null,
      lastAttemptAt: now,
    })
    .where(eq(videosTable.id, videoDbId))
    .run();
}

export function markVideoFailed(videoDbId: number, message: string) {
  db.update(videosTable)
    .set({
      aiStatus: "failed",
      lastError: message.slice(0, 500),
      lastAttemptAt: new Date().toISOString(),
    })
    .where(eq(videosTable.id, videoDbId))
    .run();
}

export function listQueuedVideos(limit = 20) {
  return db
    .select()
    .from(videosTable)
    .where(
      and(
        isNotNull(videosTable.transcript),
        isNull(videosTable.processedAt),
        sql`${videosTable.aiStatus} IN ('queued', 'failed')`,
      ),
    )
    .orderBy(videosTable.createdAt)
    .limit(limit)
    .all();
}

export function listScannedVideos(limit = 100) {
  const rows = db.select().from(videosTable).orderBy(desc(videosTable.createdAt)).limit(limit).all();

  return rows.map((video) => {
    const eventCount = db
      .select({ count: sql<number>`count(*)` })
      .from(eventsTable)
      .where(eq(eventsTable.videoDbId, video.id))
      .get();

    return {
      videoId: video.videoId,
      title: video.title,
      url: video.url,
      publishedAt: video.publishedAt,
      transcript: video.transcript,
      processedAt: video.processedAt,
      aiStatus: video.aiStatus,
      lastError: video.lastError,
      lastAttemptAt: video.lastAttemptAt,
      createdAt: video.createdAt,
      eventsCount: Number(eventCount?.count || 0),
    } as ScannedVideo;
  });
}

export function replaceVideoEvents(videoDbId: number, events: DetectedEvent[]) {
  db.delete(eventsTable).where(eq(eventsTable.videoDbId, videoDbId)).run();

  if (!events.length) {
    return;
  }

  db.insert(eventsTable)
    .values(
      events.map((entry) => ({
        videoDbId,
        event: entry.event,
        description: entry.description,
        timestamp: entry.timestamp,
      })),
    )
    .run();
}

export function getEventsByVideoId(videoId: string) {
  return db
    .select({
      id: eventsTable.id,
      videoId: videosTable.videoId,
      videoTitle: videosTable.title,
      videoUrl: videosTable.url,
      event: eventsTable.event,
      description: eventsTable.description,
      timestamp: eventsTable.timestamp,
      createdAt: eventsTable.createdAt,
    })
    .from(eventsTable)
    .innerJoin(videosTable, eq(eventsTable.videoDbId, videosTable.id))
    .where(eq(videosTable.videoId, videoId))
    .orderBy(desc(eventsTable.createdAt))
    .all() as StoredEvent[];
}

export function listEvents(videoId?: string) {
  if (videoId) {
    return getEventsByVideoId(videoId);
  }

  return db
    .select({
      id: eventsTable.id,
      videoId: videosTable.videoId,
      videoTitle: videosTable.title,
      videoUrl: videosTable.url,
      event: eventsTable.event,
      description: eventsTable.description,
      timestamp: eventsTable.timestamp,
      createdAt: eventsTable.createdAt,
    })
    .from(eventsTable)
    .innerJoin(videosTable, eq(eventsTable.videoDbId, videosTable.id))
    .orderBy(desc(eventsTable.createdAt))
    .all() as StoredEvent[];
}