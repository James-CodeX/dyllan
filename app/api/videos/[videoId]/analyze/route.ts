import { analyzeVideoById } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) {
  try {
    const { videoId } = await params;
    const result = await analyzeVideoById(videoId);
    return Response.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
