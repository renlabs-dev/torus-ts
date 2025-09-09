import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { Suspense } from "react";
import { AgentBanner } from "../_components/agent-banner";
import { AllocationSheet } from "../_components/allocation-sheet";
import { TutorialDialog } from "../_components/tutorial-dialog";

export const metadata = () =>
  createSeoMetadata({
    title: "Agent Allocation Dashboard - Torus Portal",
    description:
      "Manage and allocate weights to agents on the Torus Network. Dashboard for root allocators to distribute network resources.",
    keywords: [
      "allocation dashboard",
      "agent weights",
      "resource allocation",
      "network management",
      "allocator interface",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/root-allocator",
    baseUrl: env("BASE_URL"),
  });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="overflow-x-hidden sm:-mt-16">
      <Suspense
        fallback={<div className="bg-background h-72 w-full animate-pulse" />}
      >
        <div className="w-full overflow-hidden">
          <AgentBanner />
        </div>
      </Suspense>
      <TutorialDialog />
      <AllocationSheet />
      <main className="animate-fade-down flex flex-1 flex-col gap-4 px-4 pt-4 sm:pt-0">
        <div className="z-50 mx-auto w-full max-w-7xl rounded-md p-1 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
