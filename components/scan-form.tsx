"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScanPipelineResult } from "@/lib/types";

const defaultInput = "https://www.youtube.com/@Dylann";

type Props = {
  onScanComplete?: () => void;
};

export function ScanForm({ onScanComplete }: Props) {
  const [input, setInput] = useState(defaultInput);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanPipelineResult | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });

      const payload = (await res.json()) as ScanPipelineResult & { error?: string };

      if (!res.ok) {
        throw new Error(payload.error || "Scan failed.");
      }

      setResult(payload);
      onScanComplete?.();
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Scan failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Scan Channel or Video</CardTitle>
          <CardDescription>Paste a YouTube channel URL or single video URL to detect record events.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://www.youtube.com/@channel" required />
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Scanning..." : "Scan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertTitle>Scan failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Latest Scan Summary</CardTitle>
            <CardDescription>
              <span className="mr-3">Total: {result.totalVideos}</span>
              <span className="mr-3">Scanned: {result.scannedVideos}</span>
              <span className="mr-3">Cached: {result.cachedVideos}</span>
              <span className="mr-3">Failed: {result.failedVideos}</span>
              <span>Events: {result.newEvents}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.items.map((item) => (
              <div key={item.videoId} className="flex items-start justify-between gap-3 rounded-lg border border-border/70 p-3">
                <div>
                  <p className="font-medium leading-tight">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.videoId}</p>
                </div>

                <div className="flex items-center gap-2">
                  {item.error ? <Badge className="bg-destructive text-destructive-foreground">Failed</Badge> : null}
                  <Badge variant={item.cached ? "secondary" : "default"}>{item.cached ? "Cached" : "Fresh"}</Badge>
                  <Badge variant="outline">{item.eventsFound} events</Badge>
                </div>
              </div>
            ))}

            {result.items.some((item) => item.error) ? (
              <Alert className="mt-3 border-destructive/40 bg-destructive/5">
                <AlertTitle>Some videos were queued</AlertTitle>
                <AlertDescription>
                  {result.items
                    .filter((item) => item.error)
                    .slice(0, 2)
                    .map((item) => `${item.title}: ${item.error}`)
                    .join(" | ")}
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}