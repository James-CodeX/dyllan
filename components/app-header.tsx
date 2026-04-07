import Link from "next/link";

import { Button } from "@/components/ui/button";

export function AppHeader() {
  return (
    <header className="border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">History Tracker</p>
          <h1 className="text-lg font-semibold text-foreground">YouTube Record Events</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/">Dashboard</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/events">Events</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}