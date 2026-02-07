"use client";

import { DashboardTabs } from "../_components/dashboard/dashboard-tabs";
import { cinzelDecorative } from "../fonts";

export default function DashboardPage() {
  return (
    <main className="container mx-auto flex min-h-screen w-full max-w-screen-xl flex-col gap-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1
          className={`${cinzelDecorative.className} text-2xl tracking-wide`}
          style={{ color: "hsl(38 50% 78%)" }}
        >
          Dashboard
        </h1>
      </div>
      <DashboardTabs />
    </main>
  );
}
