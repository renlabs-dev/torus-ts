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

const navSidebarOptions = [
  { title: "Agents", href: "agents" },
  { title: "Ideas", href: "ideas" },
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
      // !navSidebarOptions.find((view) => view.href === viewMode)
      viewMode !== "agents"
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
              <SelectItem
                value={view.href}
                key={view.href}
                disabled={view.href === "ideas"}
              >
                {view.title} {view.href === "ideas" && "(Coming Soon)"}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <div className="hidden max-h-fit w-full min-w-fit flex-col gap-6 md:flex">
        <Card className="flex flex-col gap-1.5 p-5">
          {navSidebarOptions.map((view) => {
            if (view.href === "ideas") {
              return (
                <Button
                  key={view.href}
                  variant="ghost"
                  disabled
                  className={`w-full justify-between gap-4 border-none px-3 text-base`}
                >
                  {view.title} (Coming Soon)
                </Button>
              );
            }

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
