"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Icons } from "@torus-ts/ui/components/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { getLinks } from "@torus-ts/ui/lib/data";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import {
  ArrowLeftRight,
  BookOpen,
  BookText,
  Home,
  Landmark,
  Network,
  PanelLeftIcon,
  UserPlus,
  Wallet,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useLandingSidebar } from "./landing-sidebar-context";

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

// Top-level navigation items (no group title)
const navTop = [
  { title: "Home", url: "/", icon: Home, external: false },
  { title: "Portal", url: "/portal", icon: Network, external: false },
];

// Grouped navigation matching hover header structure
const navGroups = [
  {
    title: "Starter",
    items: [
      { title: "Blog", url: links.blog, icon: BookText, external: true },
      { title: "Wallet", url: links.wallet, icon: Wallet, external: true },
      {
        title: "Bridge",
        url: links.bridge,
        icon: ArrowLeftRight,
        external: true,
      },
    ],
  },
  {
    title: "Network",
    items: [
      { title: "Join", url: links.discord, icon: UserPlus, external: true },
      { title: "Docs", url: links.docs, icon: BookOpen, external: true },
      { title: "DAO", url: links.governance, icon: Landmark, external: true },
    ],
  },
];

const navSocials = [
  { title: "GitHub", url: links.github, icon: Icons.Github },
  { title: "Twitter", url: links.x, icon: Icons.X },
  { title: "Discord", url: links.discord, icon: Icons.Discord },
  { title: "Telegram", url: links.telegram, icon: Icons.Telegram },
];

const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_ICON = "3rem";

export function LandingSidebar() {
  const { isExpanded, isSidebarOpen, toggleSidebar } = useLandingSidebar();

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
                {/* Top-level items (Home, Portal) */}
                <div className="flex w-full flex-col p-2">
                  <ul className="flex w-full flex-col gap-1">
                    {navTop.map((item) => (
                      <li key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link
                              href={item.url}
                              className={cn(
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative z-10 flex items-center gap-2 rounded-md p-2 text-sm",
                                !isSidebarOpen && "justify-center",
                              )}
                            >
                              <item.icon className="size-4 shrink-0" />
                              {isSidebarOpen && (
                                <span className="truncate">{item.title}</span>
                              )}
                            </Link>
                          </TooltipTrigger>
                          {!isSidebarOpen && (
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Grouped navigation (Starter, Network) */}
                {navGroups.map((group) => (
                  <div key={group.title} className="flex w-full flex-col p-2">
                    {isSidebarOpen && (
                      <div className="text-sidebar-foreground/70 flex h-8 items-center px-2 text-xs font-medium">
                        {group.title}
                      </div>
                    )}
                    <ul className="flex w-full flex-col gap-1">
                      {group.items.map((item) => (
                        <li key={item.title}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {item.external ? (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative z-10 flex items-center gap-2 rounded-md p-2 text-sm",
                                    !isSidebarOpen && "justify-center",
                                  )}
                                >
                                  <item.icon className="size-4 shrink-0" />
                                  {isSidebarOpen && (
                                    <span className="truncate">
                                      {item.title}
                                    </span>
                                  )}
                                </a>
                              ) : (
                                <Link
                                  href={item.url}
                                  className={cn(
                                    "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative z-10 flex items-center gap-2 rounded-md p-2 text-sm",
                                    !isSidebarOpen && "justify-center",
                                  )}
                                >
                                  <item.icon className="size-4 shrink-0" />
                                  {isSidebarOpen && (
                                    <span className="truncate">
                                      {item.title}
                                    </span>
                                  )}
                                </Link>
                              )}
                            </TooltipTrigger>
                            {!isSidebarOpen && (
                              <TooltipContent side="right">
                                {item.title}
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Socials */}
                <div className="mt-auto p-2">
                  <ul
                    className={cn(
                      "flex w-full",
                      isSidebarOpen
                        ? "flex-row justify-around px-2"
                        : "flex-col gap-1",
                    )}
                  >
                    {navSocials.map((item) => (
                      <li key={item.title}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={cn(
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground relative z-10 flex items-center justify-center rounded-md p-2",
                              )}
                            >
                              <item.icon className="size-4" />
                            </a>
                          </TooltipTrigger>
                          {!isSidebarOpen && (
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Footer with toggle button */}
              <div className="flex flex-col gap-2 p-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "relative z-10 size-7",
                    !isSidebarOpen && "mx-auto",
                  )}
                  onClick={toggleSidebar}
                >
                  <PanelLeftIcon className="size-4" />
                  <span className="sr-only">Toggle Sidebar</span>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </TooltipProvider>
      )}
    </AnimatePresence>
  );
}
