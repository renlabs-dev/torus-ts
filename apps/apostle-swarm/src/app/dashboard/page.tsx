"use client";

import { DashboardTabs } from "../_components/dashboard/dashboard-tabs";

export default function DashboardPage() {
  return (
    <main className="container mx-auto flex min-h-screen w-full max-w-screen-xl flex-col gap-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <DashboardTabs />
    </main>
  );
}
