import { cookies } from "next/headers";

import { AdminLoginForm } from "@/components/admin-login-form";
import { DashboardView } from "@/components/dashboard-view";

export default async function AddPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  const isAuthenticated = token?.value === process.env.ADMIN_PASSWORD && !!process.env.ADMIN_PASSWORD;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 md:px-8 md:py-8">
      <h1 className="text-base font-semibold text-[var(--dashboard-title)] md:text-lg">Scan Dashboard</h1>
      {isAuthenticated ? <DashboardView /> : <AdminLoginForm />}
    </main>
  );
}