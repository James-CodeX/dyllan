export type ScanInputVideo = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
};

export type VideoAiStatus = "needs_transcript" | "queued" | "failed" | "success";

export type DetectedEvent = {
  event: string;
  description: string;
  timestamp: string;
};

export type ScanItemResult = {
  videoId: string;
  title: string;
  cached: boolean;
  eventsFound: number;
  error?: string;
};

export type ScanPipelineResult = {
  totalVideos: number;
  scannedVideos: number;
  cachedVideos: number;
  failedVideos: number;
  newEvents: number;
  items: ScanItemResult[];
};

export type StoredEvent = {
  id: number;
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  event: string;
  description: string;
  timestamp: string;
  createdAt: string;
};

export type ScannedVideo = {
  videoId: string;
  title: string;
  url: string;
  publishedAt: string;
  transcript: string | null;
  processedAt: string | null;
  aiStatus: VideoAiStatus;
  lastError: string | null;
  lastAttemptAt: string | null;
  createdAt: string;
  eventsCount: number;
};