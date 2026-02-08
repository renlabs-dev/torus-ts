"use client";

import { DashboardTabs } from "../_components/dashboard/dashboard-tabs";

export default function DashboardPage() {
  return (
    <main className="container mx-auto flex min-h-screen w-full max-w-screen-xl flex-col gap-6 px-6 py-8">
      <DashboardTabs />
    </main>
  );
}
