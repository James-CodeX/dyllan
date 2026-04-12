import { runCheckForUpdates } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const DEFAULT_RSS_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=UCzPpbeK8ANcNKg5aoMB0miw";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const source = process.env.YOUTUBE_CHANNEL_INPUT || process.env.YOUTUBE_RSS_URL || DEFAULT_RSS_URL;
    const result = await runCheckForUpdates(source);

    return Response.json({
      ok: true,
      source,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron task failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
