import { Suspense } from "react";
import { AgentContentList } from "./components/agent-content-list";
import { SidebarInfo } from "./components/sidebar-info";
import { PopoverInfo } from "./components/popover-info";

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center border-t">
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <main className="mx-auto min-w-full py-10 text-white">
          <div className="flex w-full flex-row justify-around gap-3 md:flex-col md:gap-6">
            <div className="flex w-full flex-col gap-4 md:max-w-[280px]">
              <SidebarInfo />
            </div>
            <PopoverInfo />
            <div className="flex w-full flex-col">
              <Suspense fallback={<div>Loading...</div>}>
                <AgentContentList />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </main>
  );
}
