import { Suspense } from "react";

import { AgentContentList } from "../components/agent-content-list";
import { PopoverInfo } from "../components/popover-info";

export default function Page() {
  return (
    <main className="flex flex-col items-center justify-center border-t pb-12">
      <div className="mx-auto w-full max-w-screen-xl px-4">
        <main className="mx-auto min-w-full py-10 text-white">
          <div className="flex w-full flex-col justify-around gap-3 md:gap-6">
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
