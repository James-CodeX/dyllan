import { z } from "zod";

import { runScan } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  input: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid input." }, { status: 400 });
    }

    const result = await runScan(parsed.data.input);
    return Response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}