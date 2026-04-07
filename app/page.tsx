import { DashboardView } from "@/components/dashboard-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 md:px-6">
      <Card className="border-emerald-300/30 bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">YouTube History Record Tracker</CardTitle>
          <CardDescription className="max-w-3xl text-sm md:text-base">
            Scan one video or an entire channel, fetch transcripts with Apify, detect record-breaking moments with OpenRouter, and store results in SQLite.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground md:text-sm">
          Channel scans include videos from the last 12 months and skip already processed videos.
        </CardContent>
      </Card>

      <DashboardView />
    </main>
  );
}
