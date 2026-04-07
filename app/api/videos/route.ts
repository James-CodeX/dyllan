import { listScannedVideos } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const videos = listScannedVideos();
    return Response.json({ videos });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load scanned videos.";
    return Response.json({ error: message }, { status: 500 });
  }
}
