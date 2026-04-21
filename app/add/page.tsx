import { DashboardView } from "@/components/dashboard-view";
import { getConfiguredScanSource } from "@/lib/scan-source";

export default function AddPage() {
  const initialInput = getConfiguredScanSource();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-base font-semibold text-[var(--dashboard-title)] md:text-lg">Scan Dashboard</h1>
      <DashboardView initialInput={initialInput} />
    </main>
  );
}
