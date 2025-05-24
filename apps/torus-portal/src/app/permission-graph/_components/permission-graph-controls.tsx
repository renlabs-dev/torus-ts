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
    <div className="flex items-center gap-4 w-full max-w-4xl">
      <div className="w-80 flex-shrink-0">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="permission-graph">Permission Graph</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative flex-1 min-w-0">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <Input
          placeholder="Search for any agent or permission..."
          className="pl-9 w-full"
        />
      </div>
    </div>
  );
}