import type { StoredEvent } from "@/lib/types";

type Props = {
  events: StoredEvent[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EventsTable({ events }: Props) {
  const grouped = [] as Array<{
    videoId: string;
    videoTitle: string;
    videoUrl: string;
    videoPublishedAt: string;
    items: StoredEvent[];
  }>;

  const groupedIndex = new Map<string, number>();

  for (const event of events) {
    const existingIndex = groupedIndex.get(event.videoId);

    if (existingIndex !== undefined) {
      grouped[existingIndex].items.push(event);
      continue;
    }

    groupedIndex.set(event.videoId, grouped.length);
    grouped.push({
      videoId: event.videoId,
      videoTitle: event.videoTitle,
      videoUrl: event.videoUrl,
      videoPublishedAt: event.videoPublishedAt,
      items: [event],
    });
  }

  return (
    <section>
      <p className="py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3a4149] md:text-[11px]">Records {events.length}</p>
      {grouped.map((group) => (
        <article key={group.videoId} className="border-b-2 border-[#3a4047]/75 py-2.5 md:py-3">
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#4a525a] md:text-[10px]">
            <span>{formatDate(group.videoPublishedAt)}</span>
            <span>•</span>
            <span>{group.items.length} record{group.items.length > 1 ? "s" : ""}</span>
          </div>

          <div className="mt-1.5 text-[10px] md:text-[11px]">
            <a href={group.videoUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              {group.videoTitle}
            </a>
          </div>

          <div className="mt-2 space-y-2">
            {group.items.map((event) => (
              <div key={event.id}>
                <h2 className="text-[13px] font-semibold text-[#2f363d] md:text-sm">{event.event}</h2>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[#424a53] md:text-[11px]">{event.description}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}