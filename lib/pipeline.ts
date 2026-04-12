import { fetchTranscript } from "@/lib/apify";
import {
  getEventsByVideoId,
  getVideo,
  isVideoProcessed,
  listQueuedVideos,
  markVideoFailed,
  markVideoProcessed,
  replaceVideoEvents,
  upsertVideo,
} from "@/lib/db/repository";
import { analyzeTranscript } from "@/lib/openrouter";
import type { ScanItemResult, ScanPipelineResult } from "@/lib/types";
import { collectChannelFeedVideos, collectVideos } from "@/lib/youtube";

export async function analyzeVideoById(videoId: string): Promise<ScanItemResult> {
  const existing = await getVideo(videoId);

  if (!existing) {
    throw new Error("Video not found in database.");
  }

  if (!existing.transcript) {
    const transcript = (await fetchTranscript(existing.url)).slice(0, 20000);
    await upsertVideo(
      {
        videoId: existing.videoId,
        title: existing.title,
        url: existing.url,
        publishedAt: existing.publishedAt,
      },
      transcript,
    );
  }

  const refreshed = await getVideo(videoId);
  if (!refreshed?.transcript) {
    throw new Error("Transcript is missing.");
  }

  try {
    const events = await analyzeTranscript(refreshed.transcript);
    await replaceVideoEvents(refreshed.id, events);
    await markVideoProcessed(refreshed.id);

    return {
      videoId: refreshed.videoId,
      title: refreshed.title,
      cached: false,
      eventsFound: events.length,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process video.";
    await markVideoFailed(refreshed.id, message);
    return {
      videoId: refreshed.videoId,
      title: refreshed.title,
      cached: false,
      eventsFound: 0,
      error: message,
    };
  }
}

export async function runScan(input: string): Promise<ScanPipelineResult> {
  const freshVideos = await collectVideos(input);
  const queuedVideos = (await listQueuedVideos()).map((video) => ({
    videoId: video.videoId,
    title: video.title,
    url: video.url,
    publishedAt: video.publishedAt,
  }));

  const videos = [...queuedVideos, ...freshVideos].filter(
    (video, index, list) => list.findIndex((item) => item.videoId === video.videoId) === index,
  );
  const items: ScanItemResult[] = [];

  let scannedVideos = 0;
  let cachedVideos = 0;
  let failedVideos = 0;
  let newEvents = 0;

  for (const video of videos) {
    if (await isVideoProcessed(video.videoId)) {
      const events = await getEventsByVideoId(video.videoId);
      items.push({
        videoId: video.videoId,
        title: video.title,
        cached: true,
        eventsFound: events.length,
      });
      cachedVideos += 1;
      continue;
    }

    try {
      const existing = await getVideo(video.videoId);
      const transcript = existing?.transcript ?? (await fetchTranscript(video.url)).slice(0, 20000);
      await upsertVideo(video, transcript);
      const analyzed = await analyzeVideoById(video.videoId);

      if (analyzed.error) {
        failedVideos += 1;
      } else {
        scannedVideos += 1;
        newEvents += analyzed.eventsFound;
      }
      items.push(analyzed);
    } catch (error) {
      const saved = await getVideo(video.videoId);
      if (saved) {
        const message = error instanceof Error ? error.message : "Failed to process video. Added to queue.";
        await markVideoFailed(saved.id, message);
      }
      failedVideos += 1;
      items.push({
        videoId: video.videoId,
        title: video.title,
        cached: false,
        eventsFound: 0,
        error: error instanceof Error ? error.message : "Failed to process video. Added to queue.",
      });
    }
  }

  return {
    totalVideos: videos.length,
    scannedVideos,
    cachedVideos,
    failedVideos,
    newEvents,
    items,
  };
}

export async function runCheckForUpdates(channelInput: string): Promise<ScanPipelineResult> {
  const feedVideos = await collectChannelFeedVideos(channelInput);
  const items: ScanItemResult[] = [];
  const targets: Array<{ videoId: string; title: string }> = [];

  let scannedVideos = 0;
  let cachedVideos = 0;
  let failedVideos = 0;
  let newEvents = 0;

  for (const video of feedVideos) {
    const existing = await getVideo(video.videoId);

    if (!existing) {
      await upsertVideo(video, null);
      targets.push({ videoId: video.videoId, title: video.title });
      continue;
    }

    await upsertVideo(video, existing.transcript);

    if (existing.processedAt) {
      cachedVideos += 1;
      continue;
    }

    targets.push({ videoId: video.videoId, title: video.title });
  }

  for (const target of targets) {
    try {
      const analyzed = await analyzeVideoById(target.videoId);
      if (analyzed.error) {
        failedVideos += 1;
      } else {
        scannedVideos += 1;
        newEvents += analyzed.eventsFound;
      }
      items.push(analyzed);
    } catch (error) {
      const saved = await getVideo(target.videoId);
      const message = error instanceof Error ? error.message : "Failed to process new video.";

      if (saved) {
        await markVideoFailed(saved.id, message);
      }

      failedVideos += 1;
      items.push({
        videoId: target.videoId,
        title: target.title,
        cached: false,
        eventsFound: 0,
        error: message,
      });
    }
  }

  return {
    totalVideos: feedVideos.length,
    scannedVideos,
    cachedVideos,
    failedVideos,
    newEvents,
    items,
  };
}
