"use client";

import { Suspense } from "react";
import PermissionGraphContainer from "./_components/permission-graph-container";
import PortalNavigationTabs from "~/app/_components/portal-navigation-tabs";

export default function PermissionGraphPage() {
  return (
    <Suspense fallback={null}>
      <div className="absolute top-[3.9rem] left-2 right-96 z-10">
        <PortalNavigationTabs />
      </div>
      <PermissionGraphContainer />
    </Suspense>
  );
}
