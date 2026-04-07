import { z } from "zod";

import { fetchTranscript } from "@/lib/apify";
import {
  deleteAllVideos,
  deleteVideosByStatus,
  getVideo,
  listScannedVideos,
  upsertVideo,
} from "@/lib/db/repository";
import { analyzeVideoById } from "@/lib/pipeline";
import { getOrderedSourceVideos } from "@/lib/videos-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  action: z.enum([
    "import_from_json",
    "fetch_transcripts",
    "analyze_all",
    "retry_failed",
    "delete_all",
    "delete_failed",
  ]),
  concurrency: z.number().int().min(1).max(5).optional(),
});

type AnalyzeTarget = {
  videoId: string;
  title: string;
};

type TranscriptTarget = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
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

async function fetchTranscriptsWithConcurrency(targets: TranscriptTarget[], concurrency: number) {
  const results = Array.from({ length: targets.length }, () => ({
    videoId: "",
    title: "",
    ok: false,
    error: "",
  }));

  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const current = cursor;
      cursor += 1;
      const target = targets[current];

      try {
        const transcript = (await fetchTranscript(target.url)).slice(0, 20000);
        await upsertVideo(
          {
            videoId: target.videoId,
            title: target.title,
            url: target.url,
            publishedAt: target.publishedAt,
          },
          transcript,
        );

        results[current] = {
          videoId: target.videoId,
          title: target.title,
          ok: true,
          error: "",
        };
      } catch (error) {
        results[current] = {
          videoId: target.videoId,
          title: target.title,
          ok: false,
          error: error instanceof Error ? error.message : "Transcript fetch failed.",
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

    if (action === "import_from_json") {
      const source = getOrderedSourceVideos();
      let inserted = 0;
      let existing = 0;

      for (const entry of source) {
        const found = await getVideo(entry.videoId);
        if (found) {
          existing += 1;
          continue;
        }

        await upsertVideo(
          {
            videoId: entry.videoId,
            title: entry.title,
            url: entry.videoUrl,
            publishedAt: entry.publishDate,
          },
          null,
        );
        inserted += 1;
      }

      return Response.json({
        summary: {
          action,
          total: source.length,
          inserted,
          existing,
        },
      });
    }

    if (action === "fetch_transcripts") {
      const allVideos = await listScannedVideos(5000);
      const targets = allVideos
        .filter((video) => !video.transcript)
        .map((video) => ({
          videoId: video.videoId,
          title: video.title,
          url: video.url,
          publishedAt: video.publishedAt,
        }));

      if (!targets.length) {
        return Response.json({
          summary: {
            action,
            total: 0,
            success: 0,
            failed: 0,
          },
          items: [],
        });
      }

      const results = await fetchTranscriptsWithConcurrency(targets, parsed.data.concurrency ?? 3);
      const success = results.filter((item) => item.ok).length;
      const failed = results.length - success;

      return Response.json({
        summary: {
          action,
          total: results.length,
          success,
          failed,
        },
        items: results,
      });
    }

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
