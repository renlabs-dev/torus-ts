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
import { Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useCallback, useEffect } from "react";

export const navSidebarOptions = [
  { title: "Whitelist Applications", href: "agent-applications" },
  { title: "Proposals", href: "proposals" },
  { title: "DAO Portal", href: "dao-portal" },
  { title: "Agents", href: "agents" },
  //TODO: Uncomment when the other pages get done
  // { title: "Community Concepts", href: "community-concepts" },
] as const;

export type GovernanceViewMode = (typeof navSidebarOptions)[number]["href"];

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
        onValueChange={(value) => router.push(`?view=${value}`)}
        value={viewMode ?? defaultView}
      >
        <SelectTrigger className="w-full lg:hidden">
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

      <div className="animate-fade-up animate-delay-200 hidden max-h-fit w-full min-w-fit flex-col gap-6 lg:flex">
        <Card className="flex flex-col gap-1.5 p-5">
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
