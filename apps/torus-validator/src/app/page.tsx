import { Suspense } from "react";
import { SidebarLinks } from "./components/sidebar-links";
import { IdeasContent } from "./components/ideas-content";
import { AgentContentList } from "./components/agent-content-list";
import { SidebarInfo } from "./components/sidebar-info";
import { PopoverInfo } from "./components/popover-info";

export default function Page() {
  return (
    <main className="flex w-full animate-fade-down flex-col justify-center gap-4 py-12 md:flex-row md:gap-6">
      <div className="flex w-full flex-col gap-4 md:max-w-[280px]">
        <div className="flex w-full gap-2">
          <SidebarLinks />
          <PopoverInfo />
        </div>
        <SidebarInfo />
      </div>
      <div className="flex w-full flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <AgentContentList />
        </Suspense>
        <Suspense fallback={<div>Loading...</div>}>
          <IdeasContent />
        </Suspense>
      </div>
    </main>
  );
}
