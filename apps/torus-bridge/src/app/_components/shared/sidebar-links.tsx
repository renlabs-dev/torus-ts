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
import { env } from "~/env";
import { Check } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

const navSidebarOptions = [
  { title: "Wallet", href: links.wallet },
  { title: "Base Bridge", href: "/" },
] as const;

export const Sidebar = () => {
  const defaultView = navSidebarOptions[1].href;

  return (
    <>
      <Select value={defaultView}>
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

      <div className="hidden max-h-fit w-full min-w-fit flex-col gap-6 lg:flex">
        <Card className="flex flex-col gap-1.5 p-5">
          {navSidebarOptions.map((view) => {
            return (
              <Link href={view.href} key={view.href} prefetch>
                <Button
                  variant="ghost"
                  className={`w-full justify-between gap-4 border-none px-3 text-base ${view.title === "Base Bridge" ? "bg-accent" : ""}`}
                >
                  {view.title}
                  <Check
                    size={16}
                    className={`${view.title === "Base Bridge" ? "opacity-100" : "opacity-0"} transition`}
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
