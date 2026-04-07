import { listEvents } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId") || undefined;
  const events = listEvents(videoId);

  return Response.json({ events });
}