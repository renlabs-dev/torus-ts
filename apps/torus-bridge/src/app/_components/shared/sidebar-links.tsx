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
import { Suspense, useCallback, useMemo } from "react";

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

  const getActiveOptions = useCallback(
    (pathname: string) =>
      baseOptions.map((option) => ({
        ...option,
        isActive: option.href === pathname,
      })),
    [baseOptions],
  );

  const activeOptions = useMemo(
    () => getActiveOptions(pathname),
    [pathname, getActiveOptions],
  );

  const handleSelectChange = useCallback(
    (value: string) => {
      if (value.startsWith("http")) {
        window.open(value, "_blank", "noopener,noreferrer");
        return;
      }

      router.push(value);
    },
    [router],
  );

  return (
    <>
      <Select value={pathname} onValueChange={handleSelectChange}>
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
