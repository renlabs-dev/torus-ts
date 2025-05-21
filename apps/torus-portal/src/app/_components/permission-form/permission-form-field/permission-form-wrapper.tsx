"use client";

import type { ReactNode } from "react";

// This is a global CSS helper component to set some variables for the permission form
export function PermissionFormWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[1200px] p-8">{children}</div>
    </div>
  );
}
