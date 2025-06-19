"use client";

import React, { useCallback, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { Network, Shield, Plus, Radio, Edit } from "lucide-react";

export default function PortalNavigationTabs() {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = useMemo(
    () => [
      {
        value: "permission-graph",
        label: "Permission Graph",
        icon: Network,
        path: "/",
      },
      {
        value: "create-permission",
        label: "Create Permission",
        icon: Plus,
        path: "/create-permission",
      },
      {
        value: "edit-permission",
        label: "Edit Permission",
        icon: Edit,
        path: "/edit-permission",
      },
      {
        value: "create-constraint",
        label: "Create Constraint",
        icon: Shield,
        path: "/create-constraint",
      },
      {
        value: "create-signal",
        label: "Create Signaling",
        icon: Radio,
        path: "/create-signal",
      },
    ],
    [],
  );

  const getCurrentTab = () => {
    if (pathname === "/") return "permission-graph";
    if (pathname === "/create-permission") return "create-permission";
    if (pathname === "/edit-permission") return "edit-permission";
    if (pathname === "/create-constraint") return "create-constraint";
    if (pathname === "/create-signal") return "create-signal";
    return "permission-graph";
  };
  const currentTab = getCurrentTab();

  const handleTabChange = useCallback(
    (value: string) => {
      const item = navigationItems.find((item) => item.value === value);
      if (item) {
        router.push(item.path);
      }
    },
    [router, navigationItems],
  );

  const currentItem = navigationItems.find((item) => item.value === currentTab);

  return (
    <>
      {/* Desktop Tabs */}
      <div className="hidden md:block w-fit">
        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className="flex items-center gap-2"
                >
                  <Icon size={16} />
                  {item.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile Select - Full width breaking out of parent constraints */}
      <div className="md:hidden fixed left-0 right-0 px-2 z-20">
        <Select value={currentTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-full">
            <SelectValue>
              {currentItem && (
                <div className="flex items-center gap-2">
                  <currentItem.icon size={16} />
                  {currentItem.label}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <SelectItem key={item.value} value={item.value}>
                  <div className="flex items-center gap-2">
                    <Icon size={16} />
                    {item.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
