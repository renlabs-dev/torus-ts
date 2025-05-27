"use client";

import React, { memo, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import { Network, Shield, Plus } from "lucide-react";

const PortalNavigationTabs = memo(function PortalNavigationTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const getCurrentTab = () => {
    if (pathname === "/") return "permission-graph";
    if (pathname === "/create-permission") return "create-permission";
    if (pathname === "/create-constraint") return "create-constraint";
    return "permission-graph";
  };
  const currentTab = getCurrentTab();

  const handleTabChange = useCallback(
    (value: string) => {
      if (value === "create-constraint") {
        router.push("/create-constraint");
      } else if (value === "create-permission") {
        router.push("/create-permission");
      } else if (value === "permission-graph") {
        router.push("/");
      }
    },
    [router],
  );

  return (
    <div className="w-fit flex-shrink-0">
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permission-graph" className="flex items-center gap-2">
            <Network size={16} />
            Permission Graph
          </TabsTrigger>
          <TabsTrigger value="create-permission" className="flex items-center gap-2">
            <Shield size={16} />
            Create Permission
          </TabsTrigger>
          <TabsTrigger value="create-constraint" className="flex items-center gap-2">
            <Plus size={16} />
            Create Constraint
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
});

export default PortalNavigationTabs;
