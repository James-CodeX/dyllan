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

          <footer className="sticky bottom-0 z-20 mt-auto border-t-2 border-[var(--page-line)] bg-[var(--page-bg)] pt-2 text-[10px] text-[var(--page-text)] md:text-xs">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>© {currentYear} History Record.</span>
              <Link href="/how-it-works" className="font-medium underline underline-offset-2">
                How it works
              </Link>
              <a
                href="https://paystack.shop/pay/7kw8vdkm7a"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline underline-offset-2"
              >
                Support &hearts;
              </a>
            </p>
          </footer>
        </section>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 md:bottom-4">
        <div className="mx-auto flex w-full max-w-6xl justify-end px-6 md:px-8">
          <Image src="/dylan sticker.png" alt="Dylan sticker" width={64} height={64} className="h-auto w-[40px] opacity-95 md:w-[52px]" />
        </div>
      </div>
    </main>
  );
}
