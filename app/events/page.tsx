import { EventsTable } from "@/components/events-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listEvents } from "@/lib/db/repository";
import { getOrderedSourceVideos } from "@/lib/videos-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  let sortedEvents = [] as Awaited<ReturnType<typeof listEvents>>;
  let loadError: string | null = null;

  try {
    sortedEvents = await listEvents();

    const orderMap = new Map(
      getOrderedSourceVideos().map((video) => [video.videoId, video.order]),
    );

    sortedEvents = [...sortedEvents].sort((a, b) => {
      const orderA = orderMap.get(a.videoId) ?? Number.MAX_SAFE_INTEGER;
      const orderB = orderMap.get(b.videoId) ?? Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load events.";
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-6">
      {loadError ? (
        <Alert className="border-destructive/40 bg-destructive/5">
          <AlertTitle>Could not load events</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : sortedEvents.length ? (
        <EventsTable events={sortedEvents} />
      ) : (
        <Alert>
          <AlertTitle>No events yet</AlertTitle>
          <AlertDescription>Run a scan from Dashboard to populate event records.</AlertDescription>
        </Alert>
      )}
    </main>
  );
}