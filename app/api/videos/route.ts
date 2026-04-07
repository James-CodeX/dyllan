import { listScannedVideos } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const videos = listScannedVideos();
  return Response.json({ videos });
}
