import type { ScanInputVideo } from "@/lib/types";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function normalizeUrl(input: string) {
  const raw = input.trim();
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export function extractVideoId(input: string) {
  const url = new URL(normalizeUrl(input));

  if (url.hostname.includes("youtu.be")) {
    return url.pathname.replace("/", "").trim() || null;
  }

  if (url.hostname.includes("youtube.com")) {
    return url.searchParams.get("v");
  }

  return null;
}

async function fetchVideoTitle(videoUrl: string, fallback: string) {
  const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;
  const res = await fetch(endpoint, { cache: "no-store" });

  if (!res.ok) {
    return fallback;
  }

  const payload = (await res.json()) as { title?: string };
  return payload.title?.trim() || fallback;
}

async function resolveChannelId(channelUrl: string) {
  const url = new URL(normalizeUrl(channelUrl));
  const segments = url.pathname.split("/").filter(Boolean);

  if (segments[0] === "feeds" && segments[1] === "videos.xml") {
    const channelId = url.searchParams.get("channel_id")?.trim();
    if (channelId) {
      return channelId;
    }
    throw new Error("Could not resolve channel id from feed URL.");
  }

  if (segments[0] === "channel" && segments[1]) {
    return segments[1];
  }

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Could not load channel page.");
  }

  const html = await res.text();
  const match = html.match(/"channelId":"(UC[\w-]+)"/);

  if (!match?.[1]) {
    throw new Error("Could not resolve channel id from URL.");
  }

  return match[1];
}

function readTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.trim() || "";
}

function readAlternateLink(block: string) {
  const match = block.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"[^>]*\/?>/i);
  return match?.[1]?.trim() || "";
}

function parseFeed(xml: string) {
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  return entries
    .map((entry) => {
      const videoId = readTag(entry, "yt:videoId");
      const title = readTag(entry, "media:title") || readTag(entry, "title");
      const publishedAt = readTag(entry, "published");
      const feedUrl = readAlternateLink(entry);

      if (!videoId || !title || !publishedAt) {
        return null;
      }

      return {
        videoId,
        title,
        publishedAt,
        url: feedUrl || `https://www.youtube.com/watch?v=${videoId}`,
      };
    })
    .filter((item): item is ScanInputVideo => Boolean(item));
}

export async function collectChannelFeedVideos(channelInput: string) {
  const channelId = await resolveChannelId(channelInput);
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(feedUrl, { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Could not load channel feed.");
  }

  const xml = await res.text();
  const since = Date.now() - ONE_YEAR_MS;

  return parseFeed(xml)
    .filter((video) => Date.parse(video.publishedAt) >= since)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

export async function collectVideos(input: string) {
  const directVideoId = extractVideoId(input);

  if (directVideoId) {
    const url = `https://www.youtube.com/watch?v=${directVideoId}`;
    const title = await fetchVideoTitle(url, `Video ${directVideoId}`);
    return [
      {
        videoId: directVideoId,
        title,
        url,
        publishedAt: new Date().toISOString(),
      },
    ];
  }

  return collectChannelFeedVideos(input);
}
