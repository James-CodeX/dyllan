import { z } from "zod";

import { fetchTranscript } from "@/lib/apify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  videoUrl: z.string().url(),
  language: z.string().min(2).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid videoUrl." }, { status: 400 });
    }

    const transcript = await fetchTranscript(parsed.data.videoUrl, parsed.data.language ?? "en");
    return Response.json({ transcript });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcript fetch failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}