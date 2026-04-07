import { EventsTable } from "@/components/events-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { listEvents } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default function EventsPage() {
  const events = listEvents();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:px-6">
      {events.length ? (
        <EventsTable events={events} />
      ) : (
        <Alert>
          <AlertTitle>No events yet</AlertTitle>
          <AlertDescription>Run a scan from Dashboard to populate event records.</AlertDescription>
        </Alert>
      )}
    </main>
  );
}