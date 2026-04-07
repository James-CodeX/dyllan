import { DashboardView } from "@/components/dashboard-view";

export default function AddPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-base font-semibold text-[#08445a] md:text-lg">Scan Dashboard</h1>
      <DashboardView />
    </main>
  );
}