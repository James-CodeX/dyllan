import { and, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db, ensureDbSchema } from "@/lib/db/client";
import { eventsTable, videosTable } from "@/lib/db/schema";
import type { DetectedEvent, ScanInputVideo, ScannedVideo, StoredEvent } from "@/lib/types";

const schemaReady = ensureDbSchema();

async function ensureReady() {
  await schemaReady;
}

type VideoRow = typeof videosTable.$inferSelect;

export async function getVideo(videoId: string) {
  await ensureReady();
  const rows = await db
    .select()
    .from(videosTable)
    .where(eq(videosTable.videoId, videoId))
    .limit(1)
    .execute();
  return rows[0];
}

export async function deleteVideo(videoId: string) {
  await ensureReady();
  const deleted = await db
    .delete(videosTable)
    .where(eq(videosTable.videoId, videoId))
    .returning({ id: videosTable.id });
  return deleted.length > 0;
}

export async function upsertVideo(video: ScanInputVideo, transcript: string | null) {
  await ensureReady();
  const existing = await getVideo(video.videoId);

  if (existing) {
    await db
      .update(videosTable)
      .set({
        title: video.title,
        url: video.url,
        publishedAt: video.publishedAt,
        transcript: transcript ?? existing.transcript,
        aiStatus:
          existing.processedAt || existing.aiStatus === "success"
            ? "success"
            : transcript || existing.transcript
              ? "queued"
              : "needs_transcript",
        lastError: null,
      })
      .where(eq(videosTable.id, existing.id))
      .execute();

    return (await getVideo(video.videoId)) as VideoRow;
  }

  const created = await db
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
    .returning();

  return created[0] as VideoRow;
}

export async function isVideoProcessed(videoId: string) {
  const video = await getVideo(videoId);
  return Boolean(video?.processedAt);
}

export async function markVideoProcessed(videoDbId: number) {
  await ensureReady();
  const now = new Date().toISOString();

  await db
    .update(videosTable)
    .set({
      processedAt: now,
      aiStatus: "success",
      lastError: null,
      lastAttemptAt: now,
    })
    .where(eq(videosTable.id, videoDbId))
    .execute();
}

export async function markVideoFailed(videoDbId: number, message: string) {
  await ensureReady();
  await db
    .update(videosTable)
    .set({
      aiStatus: "failed",
      lastError: message.slice(0, 500),
      lastAttemptAt: new Date().toISOString(),
    })
    .where(eq(videosTable.id, videoDbId))
    .execute();
}

export async function listQueuedVideos(limit = 20) {
  await ensureReady();
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
    .execute();
}

export async function listScannedVideos(limit = 100) {
  await ensureReady();
  const rows = await db
    .select({
      videoId: videosTable.videoId,
      title: videosTable.title,
      url: videosTable.url,
      publishedAt: videosTable.publishedAt,
      transcript: videosTable.transcript,
      processedAt: videosTable.processedAt,
      aiStatus: videosTable.aiStatus,
      lastError: videosTable.lastError,
      lastAttemptAt: videosTable.lastAttemptAt,
      createdAt: videosTable.createdAt,
      eventsCount: sql<number>`count(${eventsTable.id})`,
    })
    .from(videosTable)
    .leftJoin(eventsTable, eq(eventsTable.videoDbId, videosTable.id))
    .groupBy(videosTable.id)
    .orderBy(desc(videosTable.createdAt))
    .limit(limit)
    .execute();

  return rows.map((video) => ({
    ...video,
    eventsCount: Number(video.eventsCount || 0),
  })) as ScannedVideo[];
}

export async function replaceVideoEvents(videoDbId: number, events: DetectedEvent[]) {
  await ensureReady();
  await db.delete(eventsTable).where(eq(eventsTable.videoDbId, videoDbId)).execute();

  if (!events.length) {
    return;
  }

  await db
    .insert(eventsTable)
    .values(
      events.map((entry) => ({
        videoDbId,
        event: entry.event,
        description: entry.description,
        timestamp: entry.timestamp,
      })),
    )
    .execute();
}

export async function getEventsByVideoId(videoId: string) {
  await ensureReady();
  return (await db
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
    .execute()) as StoredEvent[];
}

export async function listEvents(videoId?: string) {
  if (videoId) {
    return await getEventsByVideoId(videoId);
  }

  await ensureReady();
  return (await db
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
    .execute()) as StoredEvent[];
}