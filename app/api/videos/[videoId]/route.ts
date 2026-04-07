import { deleteVideo } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;
  const deleted = await deleteVideo(videoId);

  if (!deleted) {
    return Response.json({ error: "Video not found." }, { status: 404 });
  }

  return Response.json({ ok: true });
}
