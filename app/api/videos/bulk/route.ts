import { z } from "zod";

import { deleteAllVideos, deleteVideosByStatus, listScannedVideos } from "@/lib/db/repository";
import { analyzeVideoById } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum(["analyze_all", "retry_failed", "delete_all", "delete_failed"]),
  concurrency: z.number().int().min(1).max(5).optional(),
});

type AnalyzeTarget = {
  videoId: string;
  title: string;
};

async function analyzeWithConcurrency(targets: AnalyzeTarget[], concurrency: number) {
  const results = Array.from({ length: targets.length }, () => ({
    videoId: "",
    title: "",
    ok: false,
    eventsFound: 0,
    error: "",
  }));

  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const current = cursor;
      cursor += 1;
      const target = targets[current];

      try {
        const result = await analyzeVideoById(target.videoId);
        results[current] = {
          videoId: target.videoId,
          title: target.title,
          ok: !result.error,
          eventsFound: result.eventsFound,
          error: result.error || "",
        };
      } catch (error) {
        results[current] = {
          videoId: target.videoId,
          title: target.title,
          ok: false,
          eventsFound: 0,
          error: error instanceof Error ? error.message : "AI analysis failed.",
        };
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, targets.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid bulk action." }, { status: 400 });
    }

    const { action } = parsed.data;

    if (action === "delete_all") {
      const deleted = await deleteAllVideos();
      return Response.json({
        summary: {
          action,
          deleted,
        },
      });
    }

    if (action === "delete_failed") {
      const deleted = await deleteVideosByStatus("failed");
      return Response.json({
        summary: {
          action,
          deleted,
        },
      });
    }

    const allVideos = await listScannedVideos(5000);
    const pendingVideos = allVideos.filter((video) =>
      action === "retry_failed" ? video.aiStatus === "failed" : video.aiStatus !== "success",
    );

    const targets = pendingVideos
      .filter((video) => {
        if (!video.transcript) {
          return false;
        }

        return action === "retry_failed" ? video.aiStatus === "failed" : video.aiStatus !== "success";
      })
      .map((video) => ({
        videoId: video.videoId,
        title: video.title,
      }));

    if (!targets.length) {
      return Response.json({
        summary: {
          action,
          total: 0,
            pending: pendingVideos.length,
            skippedNoTranscript: pendingVideos.length,
          success: 0,
          failed: 0,
          newEvents: 0,
        },
        items: [],
      });
    }

    const results = await analyzeWithConcurrency(targets, parsed.data.concurrency ?? 3);
    const success = results.filter((item) => item.ok).length;
    const failed = results.length - success;
    const newEvents = results.reduce((sum, item) => sum + item.eventsFound, 0);

    return Response.json({
      summary: {
        action,
        total: results.length,
        pending: pendingVideos.length,
        skippedNoTranscript: pendingVideos.length - results.length,
        success,
        failed,
        newEvents,
      },
      items: results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bulk action failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
