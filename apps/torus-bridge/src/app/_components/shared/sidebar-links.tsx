"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { getLinks } from "@torus-ts/ui/lib/data";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Get the current full URL of the browser window.
 *
 * @returns The current location `href` as a string, or an empty string if `window` is not available.
 */
function getCurrentUrl() {
  return typeof window !== "undefined" ? window.location.href : "";
}

/**
 * Subscribe to browser navigation events and return an unsubscribe function.
 *
 * Invokes `callback` when the history state or URL hash changes.
 *
 * @param callback - Function called on "popstate" or "hashchange" events
 * @returns A cleanup function that removes the attached event listeners
 */
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
  };
}

/**
 * Subscribes to browser URL changes and returns the current full URL.
 *
 * @returns The current full URL as a string, or an empty string when the URL cannot be determined.
 */
function useCurrentUrl() {
  return useSyncExternalStore(subscribe, getCurrentUrl, () => "");
}

interface SidebarOptionProps {
  option: {
    title: string;
    href: string;
    isActive: boolean;
  };
}

/**
 * Render a sidebar navigation item that links to the provided `href` and visually indicates whether it is active.
 *
 * The rendered element is a linked button showing `option.title` and a check icon whose visibility reflects `option.isActive`. If `option.href` starts with `'/'`, the link is prefetched; if it starts with `'http'`, it opens in a new tab with `rel="noopener noreferrer"`.
 *
 * @param option - Navigation item data: `title` is the visible label, `href` is the target URL, and `isActive` controls active styling and the check-icon visibility
 * @returns A JSX element representing the linked button for the sidebar item
 */
function SidebarOption({ option }: SidebarOptionProps) {
  const className = cn(
    "w-full justify-between gap-2 border-none px-3 py-2 text-sm font-medium",
    option.isActive
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:text-foreground",
  );

  const checkClassName = cn(
    "transition-opacity duration-200",
    option.isActive ? "opacity-100" : "opacity-0",
  );

  return (
    <Link
      href={option.href}
      prefetch={option.href.startsWith("/")}
      target={option.href.startsWith("http") ? "_blank" : undefined}
      rel={option.href.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      <Button
        variant="ghost"
        className={className}
        aria-current={option.isActive ? "page" : undefined}
      >
        {option.title}
        <Check size={14} className={checkClassName} />
      </Button>
    </Link>
  );
}

const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const currentUrl = useCurrentUrl();

  const baseOptions = useMemo(
    () => [
      {
        title: "Wallet",
        href: getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV")).wallet,
      },
      { title: "Simple Bridge", href: "/simple" },
      { title: "Full Bridge", href: "/" },
    ],
    [],
  );

  const isOptionActive = useCallback(
    (optionHref: string) => {
      if (optionHref === pathname) {
        return true;
      }

      if (optionHref.startsWith("http") && currentUrl) {
        if (optionHref === currentUrl) {
          return true;
        }

        try {
          const optionUrl = new URL(optionHref);
          const currentUrlObj = new URL(currentUrl);

          return (
            optionUrl.hostname === currentUrlObj.hostname &&
            optionUrl.pathname === currentUrlObj.pathname
          );
        } catch {
          return false;
        }
      }

      return false;
    },
    [pathname, currentUrl],
  );

  const activeOptions = useMemo(
    () =>
      baseOptions.map((option) => ({
        ...option,
        isActive: isOptionActive(option.href),
      })),
    [baseOptions, isOptionActive],
  );

  const selectedValue = useMemo(() => {
    const activeOption = activeOptions.find((opt) => opt.isActive);
    return activeOption?.href ?? pathname;
  }, [activeOptions, pathname]);

  const handleSelectChange = useCallback(
    (value: string) => {
      if (value.startsWith("http")) {
        window.location.assign(value);
        return;
      }

      router.push(value);
    },
    [router],
  );

  return (
    <>
      <Select value={selectedValue} onValueChange={handleSelectChange}>
        <SelectTrigger className="w-full lg:hidden">
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {activeOptions.map((option) => (
              <SelectItem value={option.href} key={option.href}>
                {option.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="hidden max-h-fit w-full min-w-fit flex-col gap-6 lg:flex">
        <Card className="flex flex-col gap-0 p-4">
          {activeOptions.map((option) => (
            <SidebarOption key={option.href} option={option} />
          ))}
        </Card>
      </div>
    </>
  );
};

export const SidebarLinks = () => (
  <Suspense fallback={null}>
    <Sidebar />
  </Suspense>
);