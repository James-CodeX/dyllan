import { z } from "zod";

import { runCheckForUpdates } from "@/lib/pipeline";
import { resolveScanSource } from "@/lib/scan-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const bodySchema = z.object({
  input: z.string().trim().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as unknown;
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid input." }, { status: 400 });
    }

    const source = resolveScanSource(parsed.data.input);
    const result = await runCheckForUpdates(source);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update check failed.";
    const status = message.startsWith("Missing channel input.") ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
