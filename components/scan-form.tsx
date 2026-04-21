"use client";

import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScanPipelineResult } from "@/lib/types";

type Props = {
  initialInput: string;
  onScanComplete?: () => void;
};

type ScanAction = "scan" | "updates";

export function ScanForm({ initialInput, onScanComplete }: Props) {
  const [input, setInput] = useState(initialInput);
  const [runningAction, setRunningAction] = useState<ScanAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanPipelineResult | null>(null);

  const loading = runningAction !== null;

  async function runAction(action: ScanAction) {
    setRunningAction(action);
    setError(null);

    try {
      const endpoint = action === "updates" ? "/api/scan/updates" : "/api/scan";
      const fallbackMessage = action === "updates" ? "Update check failed." : "Scan failed.";
      const body =
        action === "updates"
          ? {
              input: input.trim() || undefined,
            }
          : {
              input,
            };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = (await res.json()) as ScanPipelineResult & { error?: string };

      if (!res.ok) {
        throw new Error(payload.error || fallbackMessage);
      }

      setResult(payload);
      onScanComplete?.();
    } catch (caught) {
      setResult(null);
      setError(caught instanceof Error ? caught.message : "Action failed.");
    } finally {
      setRunningAction(null);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runAction("scan");
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle>Scan Channel or Video</CardTitle>
          <CardDescription>
            Paste a channel URL to scan manually, or use Check for Updates to fetch RSS and process only new videos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="https://www.youtube.com/@channel" required />
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                {runningAction === "scan" ? "Scanning..." : "Scan"}
              </Button>
              <Button type="button" variant="outline" disabled={loading} className="w-full sm:w-auto" onClick={() => void runAction("updates")}>
                {runningAction === "updates" ? "Checking updates..." : "Check for Updates"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertTitle>Action failed</AlertTitle>
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