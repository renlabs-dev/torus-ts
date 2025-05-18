"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import { Input } from "@torus-ts/ui/components/input";
import { Search } from "lucide-react";

export default function PermissionGraphControls() {
  const router = useRouter();
  const pathname = usePathname();
  const currentTab =
    pathname === "/permission-graph" ? "permission-graph" : "dashboard";

  const handleTabChange = (value: string) => {
    if (value === "dashboard") {
      router.push("/");
    } else if (value === "permission-graph") {
      router.push("/permission-graph");
    }
  };

  return (
    <div className="flex justify-between items-center gap-3">
      <div className="flex-1 max-w-md">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="permission-graph">Permission Graph</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400 z-50" />
        </div>
        <Input
          placeholder="Search for any agent or permission..."
          className="pl-9"
        />
      </div>
    </div>
  );
}
