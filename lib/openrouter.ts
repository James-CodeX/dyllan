import { z } from "zod";

import type { DetectedEvent } from "@/lib/types";

const model = "qwen/qwen3.6-plus:free";

const eventSchema = z.object({
  event: z.string().min(1),
  description: z.string().min(1),
  timestamp: z.string().min(1),
});

function splitTranscript(text: string, maxLength = 12000) {
  const paragraphs = text.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if ((current + paragraph).length > maxLength && current) {
      chunks.push(current);
      current = paragraph;
      continue;
    }

    current = `${current}\n\n${paragraph}`.trim();
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length ? chunks : [text.slice(0, maxLength)];
}

function parseJsonEvents(raw: string) {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] ?? raw;
  const json = fence.match(/\[[\s\S]*\]/)?.[0] ?? "[]";

  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((item) => eventSchema.safeParse(item))
      .filter((result) => result.success)
      .map((result) => result.data);
  } catch {
    return [];
  }
}

async function runChunkAnalysis(chunk: string) {
  const token = process.env.OPENROUTER_KEY;

  if (!token) {
    throw new Error("Missing OPENROUTER_KEY.");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            "Extract any history made or record-breaking new events metioned by the speaker as history made or record breaking news from this transcript chunk.",
            "Return JSON only using this exact format:",
            '[{"event":"...","description":"...","timestamp":"..."}]',
            "If none are found, return [].",
            "Transcript chunk:",
            chunk,
          ].join("\n\n"),
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    let details = res.statusText;

    try {
      const payload = (await res.json()) as {
        error?: {
          message?: string;
          metadata?: { raw?: string };
        };
      };
      details = payload.error?.metadata?.raw || payload.error?.message || details;
    } catch {
      const text = await res.text();
      if (text) {
        details = text;
      }
    }

    throw new Error(`OpenRouter error: ${details}`);
  }

  const payload = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content ?? "[]";
  return parseJsonEvents(content);
}

export async function analyzeTranscript(transcript: string) {
  const chunks = splitTranscript(transcript);
  const results: DetectedEvent[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const events = await runChunkAnalysis(chunk);

    for (const entry of events) {
      const key = `${entry.event.toLowerCase()}::${entry.timestamp.toLowerCase()}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      results.push(entry);
    }
  }

  return results;
}