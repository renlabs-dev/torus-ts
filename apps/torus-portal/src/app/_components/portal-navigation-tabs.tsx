"use client";

import React, { useCallback, useMemo } from "react";

import {
  Edit,
  FolderPen,
  FolderX,
  Grid2x2Plus,
  Network,
  Plus,
  Radio,
  Shield,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

export default function PortalNavigationTabs() {
  const router = useRouter();
  const pathname = usePathname();

  interface NavigationItem {
    value: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    path: string;
  }

  interface NavigationCategory {
    label: string;
    items: NavigationItem[];
  }

  const navigationCategories = useMemo(
    (): NavigationCategory[] => [
      {
        label: "Overview",
        items: [
          {
            value: "permission-graph",
            label: "Hypergraph",
            icon: Network,
            path: "/",
          },
        ],
      },
      {
        label: "Permission Management",
        items: [
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
        ],
      },
      {
        label: "Namespace Operations",
        items: [
          {
            value: "create-namespace",
            label: "Create Namespace",
            icon: FolderPen,
            path: "/create-namespace",
          },
          {
            value: "delete-namespace",
            label: "Delete Namespace",
            icon: FolderX,
            path: "/delete-namespace",
          },
        ],
      },
      {
        label: "Network Operations",
        items: [
          {
            value: "register-agent",
            label: "Register Agent",
            icon: Grid2x2Plus,
            path: "/register-agent",
          },
          {
            value: "create-signal",
            label: "Create Signal",
            icon: Radio,
            path: "/create-signal",
          },
        ],
      },
    ],
    [],
  );

  // Flatten categories for easy lookup
  const allNavigationItems = useMemo(
    () => navigationCategories.flatMap((category) => category.items),
    [navigationCategories],
  );

  const getCurrentTab = () => {
    if (pathname === "/") return "permission-graph";
    if (pathname === "/create-permission") return "create-permission";
    if (pathname === "/edit-permission") return "edit-permission";
    if (pathname === "/create-constraint") return "create-constraint";
    if (pathname === "/create-signal") return "create-signal";
    if (pathname === "/register-agent") return "register-agent";
    if (pathname === "/create-namespace") return "create-namespace";
    if (pathname === "/delete-namespace") return "delete-namespace";
    return "permission-graph";
  };
  const currentTab = getCurrentTab();

  const handleTabChange = useCallback(
    (value: string) => {
      const item = allNavigationItems.find((item) => item.value === value);
      if (item) {
        router.push(item.path);
      }
    },
    [router, allNavigationItems],
  );

  const currentItem = allNavigationItems.find(
    (item) => item.value === currentTab,
  );

  return (
    <>
      {/* Mobile Select - Full width breaking out of parent constraints */}
      <div className="relative left-0 right-0 z-20">
        <Select value={currentTab} onValueChange={handleTabChange}>
          <SelectTrigger className="w-fit">
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
            {navigationCategories.map((category, categoryIndex) => (
              <SelectGroup key={category.label}>
                <SelectLabel className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                  {category.label}
                </SelectLabel>
                {category.items.map((item) => {
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
                {categoryIndex < navigationCategories.length - 1 && (
                  <SelectSeparator />
                )}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
