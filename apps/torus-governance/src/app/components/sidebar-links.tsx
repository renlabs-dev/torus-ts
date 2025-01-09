"use client";

import React, { Suspense, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Check } from "lucide-react";

import {
  Button,
  Card,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui";

const navSidebarOptions = [
  { title: "Proposals", href: "proposals" },
  { title: "Agent Applications", href: "agent-applications" },
  //TODO: Uncomment when the other pages get done
  // { title: "Community Concepts", href: "community-concepts" },
  // { title: "DAO Members Dashboard", href: "dao-members-dashboard" },
] as const;

export const Sidebar = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultView = navSidebarOptions[0].href;
  const viewMode = searchParams.get("view");

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);

      return params.toString();
    },
    [searchParams],
  );

  useEffect(() => {
    if (
      !viewMode ||
      !navSidebarOptions.find((view) => view.href === viewMode)
    ) {
      router.push(`/?${createQueryString("view", defaultView)}`, {
        scroll: false,
      });
    }
  }, [createQueryString, defaultView, router, searchParams, viewMode]);

  return (
    <>
      <Select
        onValueChange={(value) =>
          router.push(`/?${createQueryString("view", value)}`)
        }
        value={viewMode ?? defaultView}
      >
        <SelectTrigger className="w-full md:hidden">
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {navSidebarOptions.map((view) => (
              <SelectItem value={view.href} key={view.href}>
                {view.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="hidden max-h-fit w-full min-w-fit animate-fade-up flex-col gap-6 animate-delay-200 md:flex">
        <Card className="flex flex-col gap-1.5 p-5 bg-neutral-900">
          {navSidebarOptions.map((view) => {
            return (
              <Link href={`?view=${view.href}`} key={view.href} prefetch>
                <Button
                  variant="ghost"
                  className={`w-full justify-between gap-4 border-none px-3 text-base ${viewMode === view.href ? "bg-accent" : ""}`}
                >
                  {view.title}
                  <Check
                    size={16}
                    className={`${viewMode === view.href ? "opacity-100" : "opacity-0"} transition`}
                  />
                </Button>
              </Link>
            );
          })}
        </Card>
      </div>
    </>
  );
};

export const SidebarLinks = () => {
  return (
    <Suspense>
      <Sidebar />
    </Suspense>
  );
};
