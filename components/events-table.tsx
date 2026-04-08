import { Fragment } from "react";
import type { StoredEvent } from "@/lib/types";

type Props = {
  events: StoredEvent[];
  searchQuery?: string;
};

type GroupedEvents = {
  videoId: string;
  videoTitle: string;
  videoUrl: string;
  videoPublishedAt: string;
  items: StoredEvent[];
  score: number;
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tokenize(query: string) {
  return Array.from(new Set(query.toLowerCase().trim().split(/\s+/).filter(Boolean)));
}

function countOccurrences(text: string, term: string) {
  if (!term) {
    return 0;
  }

  let count = 0;
  let fromIndex = 0;

  while (fromIndex < text.length) {
    const foundIndex = text.indexOf(term, fromIndex);
    if (foundIndex < 0) {
      break;
    }

    count += 1;
    fromIndex = foundIndex + term.length;
  }

  return count;
}

function highlightText(text: string, terms: string[]) {
  if (!terms.length) {
    return text;
  }

  const sortedTerms = [...terms].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(${sortedTerms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);
  const termSet = new Set(terms.map((term) => term.toLowerCase()));

  return parts.map((part, index) => {
    if (termSet.has(part.toLowerCase())) {
      return (
        <mark key={`${part}-${index}`} className="rounded-sm bg-primary/25 px-0.5 text-[inherit]">
          {part}
        </mark>
      );
    }

    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

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

function groupAndRankEvents(events: StoredEvent[], query: string, queryTerms: string[]) {
  const groups = [] as GroupedEvents[];
  const groupedIndex = new Map<string, number>();

  for (const event of events) {
    const existingIndex = groupedIndex.get(event.videoId);

    if (existingIndex !== undefined) {
      groups[existingIndex].items.push(event);
      continue;
    }

    groupedIndex.set(event.videoId, groups.length);
    groups.push({
      videoId: event.videoId,
      videoTitle: event.videoTitle,
      videoUrl: event.videoUrl,
      videoPublishedAt: event.videoPublishedAt,
      items: [event],
      score: 0,
    });
  }

  if (!queryTerms.length) {
    return groups;
  }

  const queryPhrase = query.toLowerCase();

  return groups
    .map((group) => {
      const title = group.videoTitle.toLowerCase();
      let score = 0;

      if (queryPhrase && title.includes(queryPhrase)) {
        score += 24;
      }

      for (const term of queryTerms) {
        score += countOccurrences(title, term) * 8;
      }

      for (const item of group.items) {
        const event = item.event.toLowerCase();
        const description = item.description.toLowerCase();

        if (queryPhrase && event.includes(queryPhrase)) {
          score += 16;
        }

        if (queryPhrase && description.includes(queryPhrase)) {
          score += 10;
        }

        for (const term of queryTerms) {
          score += countOccurrences(event, term) * 6;
          score += countOccurrences(description, term) * 2;
        }
      }

      return {
        ...group,
        score,
      };
    })
    .filter((group) => group.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return b.videoPublishedAt.localeCompare(a.videoPublishedAt);
    });
}

export function EventsTable({ events, searchQuery = "" }: Props) {
  const query = searchQuery.trim();
  const queryTerms = tokenize(query);
  const grouped = groupAndRankEvents(events, query, queryTerms);
  const hasActiveSearch = queryTerms.length > 0;

  return (
    <section>
      <p className="py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--page-text)] md:text-[11px]">
        {hasActiveSearch ? `Results ${grouped.length}` : `Records ${events.length}`}
      </p>

      {hasActiveSearch && grouped.length === 0 ? (
        <p className="py-3 text-[10px] text-[var(--page-text-soft)] md:text-xs">No matches found for &quot;{query}&quot;.</p>
      ) : null}

      {grouped.map((group, index) => (
        <article key={group.videoId} className="border-b-2 border-[var(--page-line)] py-2.5 md:py-3">
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.13em] text-[var(--page-text-soft)] md:text-[10px]">
            <span>{formatDate(group.videoPublishedAt)}</span>
            <span>•</span>
            <span>{group.items.length} record{group.items.length > 1 ? "s" : ""}</span>
            {hasActiveSearch ? (
              <>
                <span>•</span>
                <span>Rank {index + 1}</span>
              </>
            ) : null}
          </div>

          <div className="mt-1.5 text-[10px] md:text-[11px]">
            <a href={group.videoUrl} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2">
              {highlightText(group.videoTitle, queryTerms)}
            </a>
          </div>

          <div className="mt-2 space-y-2">
            {group.items.map((event) => (
              <div key={event.id}>
                <h2 className="text-[13px] font-semibold text-[var(--page-text)] md:text-sm">{highlightText(event.event, queryTerms)}</h2>
                <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--page-text-soft)] md:text-[11px]">{highlightText(event.description, queryTerms)}</p>
              </div>
            ))}
          </div>
        </article>
      ))}
    </section>
  );
}