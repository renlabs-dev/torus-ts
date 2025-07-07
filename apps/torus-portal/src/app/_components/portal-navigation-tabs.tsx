"use client";

import React, { useCallback, useMemo } from "react";

import {
  ChevronDown,
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

import { Button } from "@torus-ts/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
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
            value: "register-capability",
            label: "Register Capability",
            icon: FolderPen,
            path: "/register-capability",
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
    if (pathname === "/register-capability") return "register-capability";
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
      {/* Mobile Dropdown - Full width breaking out of parent constraints */}
      <div className="relative left-0 right-0 z-20">
        <TooltipProvider>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-9 justify-between gap-2 px-3 text-sm font-medium hover:bg-accent/50"
              >
                {currentItem && (
                  <>
                    <div className="flex items-center gap-2">
                      <currentItem.icon size={16} />
                      {currentItem.label}
                    </div>
                    <ChevronDown size={14} className="opacity-50" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {navigationCategories.map((category, categoryIndex) => (
                <DropdownMenuGroup key={category.label}>
                  <DropdownMenuLabel className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    {category.label}
                  </DropdownMenuLabel>
                  {category.items.map((item) => {
                    const Icon = item.icon;

                    if (item.disabled && item.disabledTooltip) {
                      return (
                        <Tooltip key={item.value}>
                          <TooltipTrigger asChild>
                            <DropdownMenuItem
                              disabled
                              className="cursor-not-allowed opacity-50"
                              onClick={(e) => e.preventDefault()}
                            >
                              <div className="flex items-center gap-2">
                                <Icon size={16} />
                                {item.label}
                              </div>
                            </DropdownMenuItem>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.disabledTooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <DropdownMenuItem
                        key={item.value}
                        onClick={() => handleTabChange(item.value)}
                      >
                        <div className="flex items-center gap-2">
                          <Icon size={16} />
                          {item.label}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                  {categoryIndex < navigationCategories.length - 1 && (
                    <DropdownMenuSeparator />
                  )}
                </DropdownMenuGroup>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </>
  );
}
