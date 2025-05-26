"use client";

import React, { memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import PermissionGraphSearch from "./permission-graph-search";

interface PermissionGraphControlsProps {
  nodeIds?: string[];
}

const PermissionGraphControls = memo(function PermissionGraphControls({ nodeIds = [] }: PermissionGraphControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isPermissionGraph = pathname === "/permission-graph" || pathname.startsWith("/permission-graph/agent/");
  const currentTab = isPermissionGraph ? "permission-graph" : "dashboard";

  const handleTabChange = useCallback((value: string) => {
    if (value === "dashboard") {
      router.push("/");
    } else if (value === "permission-graph") {
      router.push("/permission-graph");
    }
  }, [router]);

  return (
    <div className="flex items-center gap-4 w-full max-w-4xl flex-wrap">
      <div className="w-80 flex-shrink-0">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="permission-graph">Permission Graph</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 min-w-0">
        <PermissionGraphSearch graphNodes={nodeIds} />
      </div>
    </div>
  );
});

export default PermissionGraphControls;