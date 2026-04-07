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

type SystematicScanResult = {
  summary: {
    total: number;
    success: number;
    cached: number;
    failed: number;
    skipped: number;
  };
};

type SystematicItem = {
  order: number;
  title: string;
  status: "success" | "failed" | "cached" | "skipped";
};

type SystematicProgress = {
  total: number;
  completed: number;
  currentOrder: number | null;
  currentTitle: string | null;
  success: number;
  cached: number;
  failed: number;
  skipped: number;
};

const SYSTEMATIC_START_ORDER = 1;
const SYSTEMATIC_END_ORDER = 35;

export function ScanForm({ onScanComplete }: Props) {
  const [input, setInput] = useState(defaultInput);
  const [loading, setLoading] = useState(false);
  const [systematicLoading, setSystematicLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanPipelineResult | null>(null);
  const [systematicResult, setSystematicResult] = useState<SystematicScanResult | null>(null);
  const [systematicProgress, setSystematicProgress] = useState<SystematicProgress | null>(null);

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

  async function runSystematicScan() {
    setSystematicLoading(true);
    setError(null);
    setSystematicResult(null);

    const total = SYSTEMATIC_END_ORDER - SYSTEMATIC_START_ORDER + 1;
    let success = 0;
    let cached = 0;
    let failed = 0;
    let skipped = 0;

    setSystematicProgress({
      total,
      completed: 0,
      currentOrder: null,
      currentTitle: null,
      success: 0,
      cached: 0,
      failed: 0,
      skipped: 0,
    });

    try {
      for (let order = SYSTEMATIC_START_ORDER; order <= SYSTEMATIC_END_ORDER; order += 1) {
        const res = await fetch("/api/scan/systematic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startOrder: order,
            endOrder: order,
            delayMs: 0,
          }),
        });

        const payload = (await res.json()) as {
          summary?: SystematicScanResult["summary"];
          items?: SystematicItem[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(payload.error || `Systematic scan failed at order ${order}.`);
        }

        const item = payload.items?.[0];
        if (!item) {
          throw new Error(`No item returned for order ${order}.`);
        }

        if (item.status === "success") {
          success += 1;
        }

        if (item.status === "cached") {
          cached += 1;
        }

        if (item.status === "failed") {
          failed += 1;
        }

        if (item.status === "skipped") {
          skipped += 1;
        }

        setSystematicProgress({
          total,
          completed: order - SYSTEMATIC_START_ORDER + 1,
          currentOrder: item.order,
          currentTitle: item.title,
          success,
          cached,
          failed,
          skipped,
        });
      }

      setSystematicResult({
        summary: {
          total,
          success,
          cached,
          failed,
          skipped,
        },
      });
      onScanComplete?.();
    } catch (caught) {
      setSystematicResult(null);
      setError(caught instanceof Error ? caught.message : "Systematic scan failed.");
    } finally {
      setSystematicLoading(false);
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
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={loading || systematicLoading} className="w-full sm:w-auto">
                {loading ? "Scanning..." : "Scan"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading || systematicLoading}
                onClick={() => void runSystematicScan()}
                className="w-full sm:w-auto"
              >
                {systematicLoading ? "Scanning 1 to 35..." : "Scan Videos 1 to 35"}
              </Button>
            </div>
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

      {systematicResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Systematic Scan Summary (1st to 35th)</CardTitle>
            <CardDescription>
              <span className="mr-3">Total: {systematicResult.summary.total}</span>
              <span className="mr-3">Success: {systematicResult.summary.success}</span>
              <span className="mr-3">Cached: {systematicResult.summary.cached}</span>
              <span className="mr-3">Failed: {systematicResult.summary.failed}</span>
              <span>Skipped: {systematicResult.summary.skipped}</span>
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {systematicProgress ? (
        <Card>
          <CardHeader>
            <CardTitle>Systematic Scan Progress</CardTitle>
            <CardDescription>
              Completed: {systematicProgress.completed}/{systematicProgress.total}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(systematicProgress.completed / systematicProgress.total) * 100}%` }}
              />
            </div>

            <p className="text-sm text-muted-foreground">
              {systematicProgress.currentOrder
                ? `Now processed #${systematicProgress.currentOrder}: ${systematicProgress.currentTitle}`
                : "Waiting to start..."}
            </p>

            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span>Success: {systematicProgress.success}</span>
              <span>Cached: {systematicProgress.cached}</span>
              <span>Failed: {systematicProgress.failed}</span>
              <span>Skipped: {systematicProgress.skipped}</span>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}