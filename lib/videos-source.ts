import fs from "node:fs";
import path from "node:path";

import { extractVideoId } from "@/lib/youtube";

type RawSourceVideo = {
  title?: string;
  videoUrl?: string;
  publishDate?: string;
};

export type OrderedSourceVideo = {
  order: number;
  videoId: string;
  videoUrl: string;
  title: string;
  publishDate: string;
};

function sourceFilePath() {
  return path.join(process.cwd(), "data", "videos.json");
}

function readRawSourceVideos() {
  try {
    const content = fs.readFileSync(sourceFilePath(), "utf-8");
    const parsed = JSON.parse(content) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as RawSourceVideo[];
  } catch {
    return [];
  }
}

export function getOrderedSourceVideos() {
  const rows = readRawSourceVideos();

  return rows
    .map((row, index) => {
      const videoUrl = row.videoUrl?.trim();
      if (!videoUrl) {
        return null;
      }

      const videoId = extractVideoId(videoUrl);
      if (!videoId) {
        return null;
      }

      return {
        order: index + 1,
        videoId,
        videoUrl,
        title: row.title?.trim() || `Video ${videoId}`,
        publishDate: row.publishDate?.trim() || new Date().toISOString(),
      } as OrderedSourceVideo;
    })
    .filter((row): row is OrderedSourceVideo => Boolean(row));
}

export function getSequentialBatchVideos() {
  const raw = readRawSourceVideos();
  const batch = raw.slice(2, 35);

  return batch.map((row, index) => {
    const order = index + 3;
    const videoUrl = row.videoUrl?.trim() || "";
    const videoId = videoUrl ? extractVideoId(videoUrl) : null;

    return {
      order,
      videoUrl,
      videoId,
      title: row.title?.trim() || (videoId ? `Video ${videoId}` : "Unknown title"),
      publishDate: row.publishDate?.trim() || new Date().toISOString(),
      valid: Boolean(videoUrl && videoId),
    };
  });
}

export function getBatchVideosByOrder(startOrder: number, endOrder: number) {
  const raw = readRawSourceVideos();
  const start = Math.max(1, startOrder);
  const end = Math.max(start, endOrder);
  const batch = raw.slice(start - 1, end);

  return batch.map((row, index) => {
    const order = start + index;
    const videoUrl = row.videoUrl?.trim() || "";
    const videoId = videoUrl ? extractVideoId(videoUrl) : null;

    return {
      order,
      videoUrl,
      videoId,
      title: row.title?.trim() || (videoId ? `Video ${videoId}` : "Unknown title"),
      publishDate: row.publishDate?.trim() || new Date().toISOString(),
      valid: Boolean(videoUrl && videoId),
    };
  });
}