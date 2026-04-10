import Image from "next/image";
import Link from "next/link";

import { EventsTable } from "@/components/events-table";
import { EventsSearchForm } from "@/components/events-search-form";
import { listEvents } from "@/lib/db/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = {
  q?: string | string[];
};

type HomeProps = {
  searchParams?: Promise<SearchParams> | SearchParams;
};

export default async function Home({ searchParams }: HomeProps) {
  const currentYear = new Date().getFullYear();
  const resolvedSearchParams = ((await searchParams) ?? {}) as SearchParams;
  const rawQuery = resolvedSearchParams.q;
  const searchQuery = typeof rawQuery === "string" ? rawQuery : rawQuery?.[0] ?? "";
  let events = [] as Awaited<ReturnType<typeof listEvents>>;
  let loadError: string | null = null;

  try {
    events = await listEvents();
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Failed to load events.";
  }

  return (
    <main className="flex min-h-screen bg-[var(--page-bg)] px-4 py-4 md:py-6">
      <div className="mx-auto flex w-full max-w-6xl flex-1">
        <section className="relative flex min-h-full w-full flex-col bg-transparent px-2 py-2 text-[11px] text-[var(--page-text)] md:px-4 md:py-3 md:text-xs">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b-2 border-[var(--page-line)] bg-[var(--page-bg)] pb-2">
            <div className="flex items-center gap-3">
              <Image
                src="/News_Daddy.png"
                alt="News Daddy logo"
                width={210}
                height={118}
                priority
                className="h-auto w-[82px] sm:w-[100px] md:w-[120px]"
              />
              <h1 className="text-sm font-semibold uppercase tracking-[0.12em] text-[var(--page-text)] md:text-base">History Made</h1>
            </div>

            <EventsSearchForm initialQuery={searchQuery} />
          </header>

          <div className="mt-2 pb-12">
            {loadError ? (
              <p className="text-[10px] font-medium text-destructive md:text-xs">Could not load events: {loadError}</p>
            ) : events.length ? (
              <EventsTable events={events} searchQuery={searchQuery} />
            ) : (
              <p className="py-3 text-[10px] text-[var(--page-text-soft)] md:text-xs">No records yet. Run a scan and your latest entries will appear here.</p>
            )}
          </div>

          <footer className="relative sticky bottom-0 z-20 mt-auto border-t-2 border-[var(--page-line)] bg-[var(--page-bg)] pt-2 pr-11 text-[10px] text-[var(--page-text)] md:pr-14 md:text-xs">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>© {currentYear} History Record.</span>
              <Link href="/how-it-works" className="font-medium underline underline-offset-2">
                How it works
              </Link>
              <a
                href="https://paystack.shop/pay/7kw8vdkm7a"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
              >
                Buy me a Coffee
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M7 6h9a1 1 0 0 1 1 1v5a5 5 0 0 1-5 5H8a3 3 0 0 1-3-3V7a1 1 0 0 1 1-1z" />
                  <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
                  <path d="M8 20h9" />
                </svg>
              </a>
            </p>
            <Image
              src="/dylan sticker.png"
              alt="Dylan sticker"
              width={64}
              height={64}
              className="pointer-events-none absolute right-0 top-0 h-auto w-[40px] -translate-y-1/2 opacity-95 md:w-[52px]"
            />
          </footer>
        </section>
      </div>
    </main>
  );
}
