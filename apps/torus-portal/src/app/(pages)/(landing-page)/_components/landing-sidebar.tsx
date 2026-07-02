"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Icons } from "@torus-ts/ui/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { cn } from "@torus-ts/ui/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookText,
  Info,
  PanelLeftIcon,
  UserPlus,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useLandingSidebar } from "./landing-sidebar-context";
import type { NavEntryId } from "./nav-links";
import { NAV_ENTRIES, TRIGGER_ABOUT_EVENT } from "./nav-links";

// The sidebar renders exactly NAV_ENTRIES (same items, same order as the
// logo nav tree); only the icons are sidebar-specific.
const NAV_ICONS: Record<NavEntryId, LucideIcon> = {
  wallet: Wallet,
  bridge: ArrowLeftRight,
  blog: BookText,
  join: UserPlus,
  about: Info,
};

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";

export function LandingSidebar() {
  const { isExpanded, isSidebarOpen, toggleSidebar } = useLandingSidebar();

  const itemClass = cn(
    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative z-10 flex w-full items-center gap-2 rounded-md p-2 text-sm",
    !isSidebarOpen && "justify-center",
  );

  return (
    <AnimatePresence>
      {isExpanded && (
        <TooltipProvider delayDuration={0}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-y-0 left-0 z-[100] flex"
            style={
              {
                "--sidebar-width": SIDEBAR_WIDTH,
                "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              } as React.CSSProperties
            }
          >
            {/* Sidebar container */}
            <motion.div
              initial={false}
              animate={{
                width: isSidebarOpen
                  ? "var(--sidebar-width)"
                  : "var(--sidebar-width-icon)",
              }}
              transition={{ duration: 0.2, ease: "linear" }}
              className="bg-sidebar text-sidebar-foreground flex h-svh flex-col border-r"
            >
              {/* Header */}
              <div className="flex flex-col gap-2 p-2">
                <div className="flex h-8 items-center">
                  <Link
                    href="/"
                    className={cn(
                      "hover:bg-sidebar-accent relative z-10 flex items-center gap-2 rounded-md p-2",
                      !isSidebarOpen && "justify-center",
                    )}
                  >
                    <Icons.Logo className="size-5 shrink-0" />
                    {isSidebarOpen && (
                      <span className="truncate font-medium">Torus</span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Content */}
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
                <div className="flex w-full flex-col p-2">
                  <ul className="flex w-full flex-col gap-1">
                    {/* Toggle/Unfold button */}
                    <li>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              itemClass,
                              "justify-start font-normal",
                              !isSidebarOpen && "justify-center",
                            )}
                            onClick={toggleSidebar}
                          >
                            <PanelLeftIcon className="size-4 shrink-0" />
                            {isSidebarOpen && (
                              <span className="truncate">Collapse</span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        {!isSidebarOpen && (
                          <TooltipContent side="right">Expand</TooltipContent>
                        )}
                      </Tooltip>
                    </li>

                    {/* Navigation - mirrors the logo nav tree exactly */}
                    {NAV_ENTRIES.map((entry) => {
                      const Icon = NAV_ICONS[entry.id];
                      return (
                        <li key={entry.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {entry.target.kind === "link" ? (
                                <a
                                  href={entry.target.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={itemClass}
                                >
                                  <Icon className="size-4 shrink-0" />
                                  {isSidebarOpen && (
                                    <span className="truncate">
                                      {entry.label}
                                    </span>
                                  )}
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    window.dispatchEvent(
                                      new CustomEvent(TRIGGER_ABOUT_EVENT),
                                    )
                                  }
                                  className={itemClass}
                                >
                                  <Icon className="size-4 shrink-0" />
                                  {isSidebarOpen && (
                                    <span className="truncate">
                                      {entry.label}
                                    </span>
                                  )}
                                </button>
                              )}
                            </TooltipTrigger>
                            {!isSidebarOpen && (
                              <TooltipContent side="right">
                                {entry.label}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
}
