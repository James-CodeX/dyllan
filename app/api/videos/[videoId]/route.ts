import { z } from "zod";

import { deleteVideo, updateVideoFields } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const updateVideoSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  url: z.string().trim().min(1, "URL is required."),
  publishedAt: z.string().trim().min(1, "Published date is required."),
});

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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  const { videoId } = await params;

  try {
    const body = await request.json();
    const parsed = updateVideoSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Invalid request.";
      return Response.json({ error: message }, { status: 400 });
    }

    const updated = await updateVideoFields(videoId, parsed.data);
    if (!updated) {
      return Response.json({ error: "Video not found." }, { status: 404 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
