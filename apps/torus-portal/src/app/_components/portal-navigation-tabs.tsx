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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";

export default function PortalNavigationTabs() {
  const router = useRouter();
  const pathname = usePathname();

  interface NavigationItem {
    value: string;
    label: string;
    icon: React.ComponentType<{ size?: number }>;
    path: string;
    disabled?: boolean;
    disabledTooltip?: string;
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
            disabled: true,
            disabledTooltip: "Coming Soon",
          },
        ],
      },
      {
        label: "Capability Operations",
        items: [
          {
            value: "create-capability",
            label: "Create Capability",
            icon: FolderPen,
            path: "/create-capability",
          },
          {
            value: "delete-capability",
            label: "Delete Capability",
            icon: FolderX,
            path: "/delete-capability",
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
    if (pathname.startsWith("/create-permission")) return "create-permission";
    if (pathname === "/edit-permission") return "edit-permission";
    if (pathname === "/create-constraint") return "create-constraint";
    if (pathname === "/create-signal") return "create-signal";
    if (pathname === "/register-agent") return "register-agent";
    if (pathname === "/create-capability") return "create-capability";
    if (pathname === "/delete-capability") return "delete-capability";
    return "permission-graph";
  };
  const currentTab = getCurrentTab();

  const handleTabChange = useCallback(
    (value: string) => {
      const item = allNavigationItems.find((item) => item.value === value);
      if (item && !item.disabled) {
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
        <TooltipProvider>
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

                    if (item.disabled && item.disabledTooltip) {
                      return (
                        <Tooltip key={item.value}>
                          <TooltipTrigger asChild>
                            <div
                              className="relative flex cursor-not-allowed select-none items-center rounded-sm px-2 py-1.5
                                text-sm opacity-50 outline-none hover:bg-accent hover:text-accent-foreground"
                              onClick={(e) => e.preventDefault()}
                            >
                              <div className="flex items-center gap-2">
                                <Icon size={16} />
                                {item.label}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.disabledTooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

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
        </TooltipProvider>
      </div>
    </>
  );
}
