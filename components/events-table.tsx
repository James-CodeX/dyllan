import type { StoredEvent } from "@/lib/types";

type Props = {
  events: StoredEvent[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown publish date";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EventsTable({ events }: Props) {
  return (
    <section>
      <p className="py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#3a4149] md:text-[11px]">Records {events.length}</p>
      {events.map((event) => (
        <article key={event.id} className="border-b-2 border-[#3a4047]/75 py-2.5 md:py-3">
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-[#4a525a] md:text-[10px]">
            <span>Published {formatDate(event.videoPublishedAt)}</span>
            <span>•</span>
            <span>{event.timestamp}</span>
          </div>

          <h2 className="mt-1 text-[13px] font-semibold text-[#2f363d] md:text-sm">{event.event}</h2>

          <p className="mt-1 text-[10px] leading-relaxed text-[#424a53] md:text-[11px]">{event.description}</p>

          <div className="mt-1.5 text-[10px] md:text-[11px]">
            <a href={event.videoUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              {event.videoTitle}
            </a>
            <p className="mt-0.5 text-[9px] text-[#5a626b] md:text-[10px]">{event.videoId}</p>
          </div>
        </article>
      ))}
    </section>
  );
}