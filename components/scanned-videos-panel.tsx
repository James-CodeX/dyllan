"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ScannedVideo } from "@/lib/types";

type Props = {
  refreshSignal: number;
};

type EditableVideoFields = {
  title: string;
  url: string;
  publishedAt: string;
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
  const [info, setInfo] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<EditableVideoFields | null>(null);
  const [bulkAction, setBulkAction] = useState<string | null>(null);

  const failedCount = videos.filter((video) => video.aiStatus === "failed").length;
  const transcriptMissingCount = videos.filter((video) => !video.transcript).length;
  const aiReadyCount = videos.filter((video) => video.aiStatus !== "success" && Boolean(video.transcript)).length;
  const retryableFailedCount = videos.filter((video) => video.aiStatus === "failed" && Boolean(video.transcript)).length;

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
    setInfo(null);

    try {
      const res = await fetch(`/api/videos/${videoId}/analyze`, {
        method: "POST",
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "AI scan failed.");
      }

      await loadVideos();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "AI scan failed.");
    } finally {
      setRunningId(null);
    }
  }

  async function removeVideo(videoId: string) {
    setDeletingId(videoId);
    setError(null);
    setInfo(null);

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

  function startEdit(video: ScannedVideo) {
    setEditingId(video.videoId);
    setEditFields({
      title: video.title,
      url: video.url,
      publishedAt: video.publishedAt,
    });
    setError(null);
    setInfo(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditFields(null);
  }

  async function saveEdit(videoId: string) {
    if (!editFields) {
      return;
    }

    setSavingId(videoId);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFields),
      });

      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || "Update failed.");
      }

      cancelEdit();
      await loadVideos();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Update failed.");
    } finally {
      setSavingId(null);
    }
  }

  async function runBulkAction(
    action:
      | "import_from_json"
      | "fetch_transcripts"
      | "analyze_all"
      | "retry_failed"
      | "delete_all"
      | "delete_failed",
  ) {
    setBulkAction(action);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch("/api/videos/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, concurrency: 3 }),
      });

      const payload = (await res.json()) as {
        error?: string;
        summary?: {
          action: string;
          total?: number;
          pending?: number;
          skippedNoTranscript?: number;
          inserted?: number;
          existing?: number;
          success?: number;
          failed?: number;
          newEvents?: number;
          deleted?: number;
        };
      };

      if (!res.ok) {
        throw new Error(payload.error || "Bulk action failed.");
      }

      const summary = payload.summary;
      if (summary?.deleted !== undefined) {
        setInfo(`Done: ${summary.deleted} videos removed.`);
      } else if (summary?.inserted !== undefined) {
        setInfo(`Imported: ${summary.inserted} new videos from JSON. Existing: ${summary.existing || 0}.`);
      } else if (summary?.action === "fetch_transcripts") {
        setInfo(`Transcripts: ${summary.success || 0}/${summary.total || 0} fetched, ${summary.failed || 0} failed.`);
      } else if (summary) {
        setInfo(
          `Done: ${summary.success || 0}/${summary.total || 0} processed, ${summary.failed || 0} failed, ${summary.newEvents || 0} events found, ${summary.skippedNoTranscript || 0} skipped (no transcript).`,
        );
      }

      await loadVideos();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bulk action failed.");
    } finally {
      setBulkAction(null);
    }
  }

  useEffect(() => {
    void loadVideos();
  }, [refreshSignal]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scanned Videos</CardTitle>
        <CardDescription>Stage workflow: import from JSON, then fetch transcripts, then AI scan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => void runBulkAction("import_from_json")}
            disabled={Boolean(bulkAction) || loading}
          >
            {bulkAction === "import_from_json" ? "Importing..." : "Import from JSON"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void runBulkAction("fetch_transcripts")}
            disabled={Boolean(bulkAction) || loading || transcriptMissingCount === 0}
          >
            {bulkAction === "fetch_transcripts"
              ? `Fetching Transcripts (${transcriptMissingCount})...`
              : `Fetch Transcripts (${transcriptMissingCount})`}
          </Button>
          <Button
            size="sm"
            onClick={() => void runBulkAction("analyze_all")}
            disabled={Boolean(bulkAction) || loading || aiReadyCount === 0}
          >
            {bulkAction === "analyze_all" ? `AI Scanning (${aiReadyCount})...` : `AI Scan (${aiReadyCount})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void runBulkAction("retry_failed")}
            disabled={Boolean(bulkAction) || loading || retryableFailedCount === 0}
          >
            {bulkAction === "retry_failed"
              ? `Retrying Failed (${retryableFailedCount})...`
              : `Retry Failed (${retryableFailedCount})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => void runBulkAction("delete_failed")}
            disabled={Boolean(bulkAction) || loading || failedCount === 0}
          >
            {bulkAction === "delete_failed" ? `Deleting Failed (${failedCount})...` : `Delete Failed (${failedCount})`}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={() => void runBulkAction("delete_all")}
            disabled={Boolean(bulkAction) || loading || videos.length === 0}
          >
            {bulkAction === "delete_all" ? `Deleting All (${videos.length})...` : `Delete All (${videos.length})`}
          </Button>
        </div>

        {loading ? <p className="text-sm text-muted-foreground">Loading videos...</p> : null}

        {error ? (
          <Alert className="border-destructive/40 bg-destructive/5">
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {info ? (
          <Alert>
            <AlertTitle>Bulk action complete</AlertTitle>
            <AlertDescription>{info}</AlertDescription>
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
                <Button
                  size="sm"
                  onClick={() => void analyze(video.videoId)}
                  disabled={runningId === video.videoId || Boolean(bulkAction) || editingId === video.videoId}
                >
                  {runningId === video.videoId
                    ? "AI Scanning..."
                    : video.aiStatus === "success"
                      ? "AI Scan Again"
                      : "AI Scan"}
                </Button>
                {editingId === video.videoId ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={cancelEdit}
                    disabled={savingId === video.videoId}
                  >
                    Cancel Edit
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEdit(video)}
                    disabled={Boolean(bulkAction) || runningId === video.videoId}
                  >
                    Edit
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => void removeVideo(video.videoId)}
                  disabled={deletingId === video.videoId || Boolean(bulkAction) || editingId === video.videoId}
                >
                  {deletingId === video.videoId ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>

            {editingId === video.videoId && editFields ? (
              <div className="mt-3 space-y-2 rounded border border-border/60 p-3">
                <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">Edit Video Fields</p>
                <Input
                  value={editFields.title}
                  onChange={(event) => setEditFields((current) => (current ? { ...current, title: event.target.value } : current))}
                  placeholder="Video title"
                />
                <Input
                  value={editFields.url}
                  onChange={(event) => setEditFields((current) => (current ? { ...current, url: event.target.value } : current))}
                  placeholder="Video URL"
                />
                <Input
                  value={editFields.publishedAt}
                  onChange={(event) =>
                    setEditFields((current) => (current ? { ...current, publishedAt: event.target.value } : current))
                  }
                  placeholder="Published date"
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => void saveEdit(video.videoId)} disabled={savingId === video.videoId || Boolean(bulkAction)}>
                    {savingId === video.videoId ? "Saving..." : "Save Changes"}
                  </Button>
                  <p className="text-xs text-muted-foreground">You can update title, URL, or published date.</p>
                </div>
              </div>
            ) : null}

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
