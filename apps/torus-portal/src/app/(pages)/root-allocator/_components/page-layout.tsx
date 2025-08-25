import type { ReactNode } from "react";

import type { AgentView } from "./agent-view-toggle";
import { AgentViewToggle } from "./agent-view-toggle";
import { Filter } from "./filter-content";

interface PageLayoutProps {
  search: string | null;
  currentView: AgentView;
  children: ReactNode;
}

export function PageLayout({ 
  search, 
  currentView, 
  children 
}: PageLayoutProps) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full flex-col items-center gap-4 md:flex-row md:justify-between">
        <Filter defaultValue={search ?? ""} isClientSide={false} />
        <AgentViewToggle currentView={currentView} />
      </div>
      {children}
    </div>
  );
}
