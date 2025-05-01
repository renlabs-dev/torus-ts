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

const navOptions = [
  { title: "Whitelist Applications", href: "/whitelist-applications" },
  { title: "DAO Dashboard", href: "/dao-dashboard" },
  { title: "Proposals", href: "/proposals" },
] as const;

export type GovernanceViewMode = (typeof navOptions)[number]["href"];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Helper function to check if a path is active
  const isActive = (href: string) =>
    pathname === href || (href === "/" && pathname === "/agent-applications");

  // Find current path for the select component
  const currentPath =
    navOptions.find((option) => isActive(option.href))?.href ?? "/";

  return (
    <>
      {/* Mobile view: dropdown select */}
      <Select onValueChange={(value) => router.push(value)} value={currentPath}>
        <SelectTrigger className="w-full lg:hidden">
          <SelectValue placeholder="Select a view" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {navOptions.map((view) => (
              <SelectItem value={view.href} key={view.href}>
                {view.title}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      {/* Desktop view: vertical buttons */}
      <div
        className="animate-fade-up animate-delay-200 hidden max-h-fit w-full min-w-fit flex-col
          gap-6 lg:flex"
      >
        <Card className="flex flex-col gap-1.5 p-5">
          {navOptions.map((view) => (
            <Link href={view.href} key={view.href} prefetch>
              <Button
                variant="ghost"
                className={`w-full justify-between gap-4 border-none px-3 text-base ${
                isActive(view.href) ? "bg-accent" : "" }`}
              >
                {view.title}
                <Check
                  size={16}
                  className={`${isActive(view.href) ? "opacity-100" : "opacity-0"} transition`}
                />
              </Button>
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}
