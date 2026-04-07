const APIFY_ACTOR_ID = "bbqmsPr0r519A0ZaV";
const API_BASE = "https://api.apify.com/v2";
const POLL_ATTEMPTS = 10;
const POLL_DELAY_MS = 2000;

function normalizeTranscript(payload: unknown): string {
  if (!payload) {
    return "";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    if (payload.every((item) => typeof item === "object" && item && "text" in item)) {
      return payload
        .map((item) => (typeof item.text === "string" ? item.text : ""))
        .join(" ")
        .trim();
    }

    return payload.map((item) => normalizeTranscript(item)).join(" ").trim();
  }

  if (typeof payload === "object") {
    const map = payload as Record<string, unknown>;
    const orderedKeys = ["transcript", "captions", "subtitles", "text", "content"];

    for (const key of orderedKeys) {
      if (key in map) {
        const normalized = normalizeTranscript(map[key]);
        if (normalized) {
          return normalized;
        }
      }
    }

    return Object.values(map)
      .map((value) => normalizeTranscript(value))
      .join(" ")
      .trim();
  }

  return "";
}

export async function fetchTranscript(videoUrl: string, language = "en") {
  const token = process.env.APIFY_KEY;

  if (!token) {
    throw new Error("Missing APIFY_KEY.");
  }

  const startRes = await fetch(
    `${API_BASE}/acts/${APIFY_ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl, language }),
      cache: "no-store",
    },
  );

  if (!startRes.ok) {
    const details = await startRes.text();
    throw new Error(`Apify error: ${details || startRes.statusText}`);
  }

  const runPayload = (await startRes.json()) as {
    data?: { id?: string; status?: string; defaultDatasetId?: string };
  };

  const startData = runPayload.data;

  if (!startData?.id) {
    throw new Error("Apify error: run id was not returned.");
  }

  let runId = startData.id;
  let runStatus = startData.status;
  let datasetId = startData.defaultDatasetId;

  for (let i = 0; i < POLL_ATTEMPTS && runStatus !== "SUCCEEDED"; i += 1) {
    await new Promise((resolve) => setTimeout(resolve, POLL_DELAY_MS));

    const pollRes = await fetch(`${API_BASE}/actor-runs/${runId}?token=${token}`, {
      cache: "no-store",
    });

    if (!pollRes.ok) {
      const details = await pollRes.text();
      throw new Error(`Apify error: ${details || pollRes.statusText}`);
    }

    const pollPayload = (await pollRes.json()) as {
      data?: { id?: string; status?: string; defaultDatasetId?: string };
    };

    if (pollPayload.data?.id) {
      runId = pollPayload.data.id;
    }

    runStatus = pollPayload.data?.status;
    datasetId = pollPayload.data?.defaultDatasetId;
  }

  if (runStatus !== "SUCCEEDED") {
    throw new Error(`Apify error: run status is ${runStatus || "unknown"}.`);
  }

  if (!datasetId) {
    throw new Error("Apify error: dataset id was not returned.");
  }

  const itemsRes = await fetch(`${API_BASE}/datasets/${datasetId}/items?token=${token}`, {
    cache: "no-store",
  });

  if (!itemsRes.ok) {
    const details = await itemsRes.text();
    throw new Error(`Apify error: ${details || itemsRes.statusText}`);
  }

  const items = (await itemsRes.json()) as unknown;
  const transcript = normalizeTranscript(items).replace(/\s+/g, " ").trim();

  if (!transcript) {
    throw new Error("Transcript not found in Apify dataset items.");
  }

  return transcript;
}