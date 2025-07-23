import { Suspense } from "react";

import { AgentBanner } from "../_components/agent-banner";
import { AllocationSheet } from "../_components/allocation-sheet";
import { TutorialDialog } from "../_components/tutorial-dialog";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="sm:-mt-16 overflow-x-hidden">
      <Suspense
        fallback={<div className="w-full h-72 bg-background animate-pulse" />}
      >
        <div className="w-full overflow-hidden">
          <AgentBanner />
        </div>
      </Suspense>
      <TutorialDialog />
      <AllocationSheet />
      <main className="flex flex-1 flex-col gap-4 p-4 animate-fade-down">
        <div className="mx-auto w-full max-w-7xl rounded-md z-50 p-1 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
