"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { CardSkeleton } from "../card-skeleton";
import { ListAgentApplications } from "./list-agent-applications";
import { ListProposals } from "./list-proposals";
import { ListCuratorCandidates } from "./list-curator-candidates";
import { navSidebarOptions } from "../sidebar-links";
import type { GovernanceViewMode } from "../sidebar-links";

const ListCardsLoadingSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      <div className="animate-fade-up animate-delay-200">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-500">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-700">
        <CardSkeleton />
      </div>
    </div>
  );
};

const validViews = navSidebarOptions.map(({ href }) => href);

const VIEW_MODE_COMPONENTS: Record<GovernanceViewMode, JSX.Element> = {
  proposals: <ListProposals />,
  "agent-applications": <ListAgentApplications />,
  "dao-portal": <ListCuratorCandidates />,
};

export const ListCardsContent = () => {
  const searchParams = useSearchParams();
  const currentView = searchParams.get("view");

  if (!validViews.includes(currentView as GovernanceViewMode)) {
    return null;
  }

  return VIEW_MODE_COMPONENTS[currentView as GovernanceViewMode];
};

export const RenderList = () => {
  return (
    <Suspense fallback={<ListCardsLoadingSkeleton />}>
      <ListCardsContent />
    </Suspense>
  );
};
