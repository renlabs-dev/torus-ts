"use client";

import { PopoverInfo } from "../_components/popover-info";
import { SidebarInfo } from "../_components/sidebar-info";
import { SidebarNav } from "../_components/sidebar-nav";

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="animate-fade-down mb-6 flex w-full flex-col gap-4 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-2/5 lg:max-w-[320px]">
        <div className="flex w-full gap-4">
          <SidebarNav />
          <PopoverInfo />
        </div>
        <SidebarInfo />
      </div>
      {children}
    </main>
  );
}
