import { runCheckForUpdates } from "@/lib/pipeline";
import { resolveScanSource } from "@/lib/scan-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const source = resolveScanSource();
    const result = await runCheckForUpdates(source);

    return Response.json({
      ok: true,
      source,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron task failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
