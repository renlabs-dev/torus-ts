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
import { usePathname } from "next/navigation";
import { Suspense } from "react";

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

const navSidebarOptions = [
  { title: "Wallet", href: links.wallet },
  { title: "Simple Bridge", href: "/simple" },
  { title: "Full Bridge", href: "/" },
] as const;

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <>
      <Select value={pathname}>
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
        <Card className="flex flex-col gap-0 p-4">
          {navSidebarOptions.map((view) => {
            const isActive =
              view.href === pathname ||
              (view.title === "Wallet" && view.href.includes(pathname));

            return (
              <Link href={view.href} key={view.href} prefetch>
                <Button
                  variant="ghost"
                  className={`w-full justify-between gap-2 border-none px-3 py-2 text-sm font-medium ${
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {view.title}
                  <Check
                    size={14}
                    className={`${isActive ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
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
