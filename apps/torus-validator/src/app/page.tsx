import { Suspense } from "react";
// import { SidebarLinks } from "./components/sidebar-links";
import { AgentContentList } from "./components/agent-content-list";
// import { SidebarInfo } from "./components/sidebar-info";
import { PopoverInfo } from "./components/popover-info";
import { IdeasContent } from "./components/ideas-content";

export default function Page() {
  return (
    <main className="mx-auto min-w-full py-10 text-white">
      <div className="flex w-full flex-col justify-around gap-3 md:flex-row md:gap-6">
        {/* <div className="flex w-full flex-col gap-4 md:max-w-[280px]">
          <div className="flex w-full gap-2">
            <SidebarLinks />
          </div>
          <SidebarInfo />
        </div> */}
        <PopoverInfo />
        <div className="flex w-full flex-col">
          <Suspense fallback={<div>Loading...</div>}>
            <AgentContentList />
          </Suspense>
          <Suspense fallback={<div>Loading...</div>}>
            <IdeasContent />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
