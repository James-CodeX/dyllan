import { listEvents } from "@/lib/db/repository";
import { getOrderedSourceVideos } from "@/lib/videos-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId") || undefined;
  const events = listEvents(videoId);

  const orderMap = new Map(
    getOrderedSourceVideos().map((video) => [video.videoId, video.order]),
  );

  const sorted = [...events].sort((a, b) => {
    const orderA = orderMap.get(a.videoId) ?? Number.MAX_SAFE_INTEGER;
    const orderB = orderMap.get(b.videoId) ?? Number.MAX_SAFE_INTEGER;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return Date.parse(b.createdAt) - Date.parse(a.createdAt);
  });

  return Response.json({ events: sorted });
}