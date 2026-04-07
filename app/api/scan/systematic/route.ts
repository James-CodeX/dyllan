import {
  getEventsByVideoId,
  getVideo,
  isVideoProcessed,
  upsertVideo,
} from "@/lib/db/repository";
import { analyzeVideoById } from "@/lib/pipeline";
import { getSequentialBatchVideos } from "@/lib/videos-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DELAY_BETWEEN_VIDEOS_MS = 5000;

type BatchItem = {
  order: number;
  videoId: string | null;
  title: string;
  status: "success" | "failed" | "cached" | "skipped";
  eventsFound: number;
  error?: string;
};

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST() {
  const batch = getSequentialBatchVideos();
  const items: BatchItem[] = [];

  for (let index = 0; index < batch.length; index += 1) {
    const entry = batch[index];

    if (!entry.valid || !entry.videoId) {
      items.push({
        order: entry.order,
        videoId: null,
        title: entry.title,
        status: "skipped",
        eventsFound: 0,
        error: "Missing or invalid videoUrl in videos.json",
      });
      continue;
    }

    if (!getVideo(entry.videoId)) {
      upsertVideo(
        {
          videoId: entry.videoId,
          title: entry.title,
          url: entry.videoUrl,
          publishedAt: entry.publishDate,
        },
        null,
      );
    }

    if (isVideoProcessed(entry.videoId)) {
      const events = getEventsByVideoId(entry.videoId);
      items.push({
        order: entry.order,
        videoId: entry.videoId,
        title: entry.title,
        status: "cached",
        eventsFound: events.length,
      });
    } else {
      const result = await analyzeVideoById(entry.videoId);
      items.push({
        order: entry.order,
        videoId: entry.videoId,
        title: entry.title,
        status: result.error ? "failed" : "success",
        eventsFound: result.eventsFound,
        error: result.error,
      });
    }

    if (index < batch.length - 1) {
      await wait(DELAY_BETWEEN_VIDEOS_MS);
    }
  }

  const summary = {
    total: items.length,
    success: items.filter((item) => item.status === "success").length,
    cached: items.filter((item) => item.status === "cached").length,
    failed: items.filter((item) => item.status === "failed").length,
    skipped: items.filter((item) => item.status === "skipped").length,
  };

  return Response.json({ summary, items });
}
