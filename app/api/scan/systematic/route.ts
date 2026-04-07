import {
  getEventsByVideoId,
  getVideo,
  upsertVideo,
} from "@/lib/db/repository";
import { analyzeVideoById } from "@/lib/pipeline";
import { getBatchVideosByOrder } from "@/lib/videos-source";

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

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    startOrder?: number;
    endOrder?: number;
    delayMs?: number;
  };

  const startOrder = body.startOrder ?? 1;
  const endOrder = body.endOrder ?? 35;
  const delayMs = Math.max(0, body.delayMs ?? DELAY_BETWEEN_VIDEOS_MS);
  const batch = getBatchVideosByOrder(startOrder, endOrder);
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

    if (getVideo(entry.videoId)) {
      const events = getEventsByVideoId(entry.videoId);
      items.push({
        order: entry.order,
        videoId: entry.videoId,
        title: entry.title,
        status: "skipped",
        eventsFound: events.length,
        error: "Video already exists in DB. Skipped to save transcript credits.",
      });
      continue;
    }

    upsertVideo(
      {
        videoId: entry.videoId,
        title: entry.title,
        url: entry.videoUrl,
        publishedAt: entry.publishDate,
      },
      null,
    );

    const result = await analyzeVideoById(entry.videoId);
    items.push({
      order: entry.order,
      videoId: entry.videoId,
      title: entry.title,
      status: result.error ? "failed" : "success",
      eventsFound: result.eventsFound,
      error: result.error,
    });

    if (index < batch.length - 1) {
      await wait(delayMs);
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
