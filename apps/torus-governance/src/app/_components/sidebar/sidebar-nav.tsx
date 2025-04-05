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
import { usePathname, useRouter } from "next/navigation";
import React from "react";

export const navSidebarOptions = [
  { title: "Whitelist Applications", href: "/" },
  { title: "Proposals", href: "/proposals" },
  { title: "DAO Portal", href: "/dao-portal" },
  { title: "Agents", href: "/agents" },
  //TODO: Uncomment when the other pages get done
  // { title: "Community Concepts", href: "/community-concepts" },
] as const;

export type GovernanceViewMode = (typeof navSidebarOptions)[number]["href"];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Map current pathname to a sidebar option for proper highlighting
  const currentPath =
    navSidebarOptions.find(
      (option) =>
        // Exact match
        pathname === option.href ||
        // Check if we're on a subpath of agent-applications (the root path)
        (option.href === "/" && pathname === "/agent-applications"),
    )?.href ?? "/";

  return (
    <>
      <Select onValueChange={(value) => router.push(value)} value={currentPath}>
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
            const isActive =
              pathname === view.href ||
              (view.href === "/" && pathname === "/agent-applications");

            return (
              <Link href={view.href} key={view.href} prefetch>
                <Button
                  variant="ghost"
                  className={`w-full justify-between gap-4 border-none px-3 text-base ${isActive ? "bg-accent" : ""}`}
                >
                  {view.title}
                  <Check
                    size={16}
                    className={`${isActive ? "opacity-100" : "opacity-0"} transition`}
                  />
                </Button>
              </Link>
            );
          })}
        </Card>
      </div>
    </>
  );
}
