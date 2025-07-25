import type { ReactNode } from "react";
import { Filter } from "./filter-content";
import { ViewSelector } from "./view-selector";

interface PageLayoutProps {
  search: string | null;
  children: ReactNode;
}

export function PageLayout({ search, children }: PageLayoutProps) {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full flex-col-reverse items-center justify-between gap-4 md:flex-row">
        <Filter defaultValue={search ?? ""} isClientSide={false} />
        <ViewSelector />
      </div>
      {children}
    </div>
  );
}
