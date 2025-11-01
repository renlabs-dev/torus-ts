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

function getCurrentUrl() {
  return typeof window !== "undefined" ? window.location.href : "";
}

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener("hashchange", callback);
  return () => {
    window.removeEventListener("popstate", callback);
    window.removeEventListener("hashchange", callback);
  };
}

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
      { title: "Fast Bridge (Recommended)", href: "/" },
      { title: "Standard Bridge", href: "/standard" },
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
