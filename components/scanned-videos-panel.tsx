"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ScannedVideo } from "@/lib/types";

type Props = {
  refreshSignal: number;
};

function statusVariant(status: ScannedVideo["aiStatus"]) {
  if (status === "success") {
    return "default" as const;
  }
  if (status === "failed") {
    return "outline" as const;
  }
  return "secondary" as const;
}

function statusLabel(status: ScannedVideo["aiStatus"]) {
  if (status === "success") {
    return "Success";
  }
  if (status === "failed") {
    return "Failed";
  }
  if (status === "queued") {
    return "Queued";
  }
  return "Needs Transcript";
}

export function ScannedVideosPanel({ refreshSignal }: Props) {
  const [videos, setVideos] = useState<ScannedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadVideos() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/videos", { cache: "no-store" });
      const payload = (await res.json()) as { videos?: ScannedVideo[]; error?: string };

      if (!res.ok) {
        throw new Error(payload.error || "Could not load scanned videos.");
      }

      setVideos(payload.videos || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load scanned videos.");
    } finally {
      setLoading(false);
    }
  }

  async function analyze(videoId: string) {
    setRunningId(videoId);
    setError(null);

    try {
      const res = await fetch(`/api/videos/${videoId}/analyze`, {
        method: "POST",
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "AI analysis failed.");
      }

      await loadVideos();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI analysis failed.");
    } finally {
      setRunningId(null);
    }
  }

  async function removeVideo(videoId: string) {
    setDeletingId(videoId);
    setError(null);

    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "DELETE" });
      const payload = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(payload.error || "Delete failed.");
      }

      await loadVideos();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    void loadVideos();
  }, [refreshSignal]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scanned Videos</CardTitle>
        <CardDescription>See transcript, current AI status, and run analysis on demand.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <p className="text-sm text-muted-foreground">Loading videos...</p> : null}

        {error ? (
          <Alert className="border-destructive/40 bg-destructive/5">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!loading && !videos.length ? <p className="text-sm text-muted-foreground">No scanned videos yet.</p> : null}

        {videos.map((video) => (
          <div key={video.videoId} className="rounded-lg border border-border/70 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <a href={video.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                  {video.title}
                </a>
                <p className="text-xs text-muted-foreground">{video.videoId}</p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={statusVariant(video.aiStatus)}>{statusLabel(video.aiStatus)}</Badge>
                <Badge variant="outline">{video.eventsCount} events</Badge>
                <Button size="sm" onClick={() => void analyze(video.videoId)} disabled={runningId === video.videoId}>
                  {runningId === video.videoId ? "Analyzing..." : "Proceed to AI"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => void removeVideo(video.videoId)}
                  disabled={deletingId === video.videoId}
                >
                  {deletingId === video.videoId ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>

            <details className="mt-2 rounded border border-border/60 p-2">
              <summary className="cursor-pointer text-sm font-medium">Transcript</summary>
              <p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">
                {video.transcript || "Transcript not available yet."}
              </p>
            </details>

            {video.lastError ? <p className="mt-2 text-xs text-destructive">Last error: {video.lastError}</p> : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
