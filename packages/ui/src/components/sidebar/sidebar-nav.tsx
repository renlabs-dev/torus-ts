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

export type NavOption = {
  title: string;
  href: string;
};

interface SidebarNavProps {
  navOptions: NavOption[];
  defaultOption?: NavOption;
  /**
   * Function to check if a path is active - default is exact match
   */
  isActive?: (href: string, pathname: string) => boolean;
  /**
   * Optional animation class
   */
  animationClass?: string;
}

export function SidebarNav({
  navOptions,
  defaultOption,
  isActive,
  animationClass = "animate-fade-up animate-delay-200",
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Default active check is exact match
  const checkIsActive = isActive || ((href: string, path: string) => href === path);

  // Find current path for the select component
  const currentPath = navOptions.find((option) => 
    checkIsActive(option.href, pathname))?.href ?? defaultOption?.href ?? navOptions[0]?.href;

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
      <div className={`${animationClass} hidden max-h-fit w-full min-w-fit flex-col gap-6 lg:flex`}>
        <Card className="flex flex-col gap-1.5 p-5">
          {navOptions.map((view) => (
            <Link href={view.href} key={view.href} prefetch>
              <Button
                variant="ghost"
                className={`w-full justify-between gap-4 border-none px-3 text-base ${
                  checkIsActive(view.href, pathname) ? "bg-accent" : ""
                }`}
              >
                {view.title}
                <Check
                  size={16}
                  className={`${checkIsActive(view.href, pathname) ? "opacity-100" : "opacity-0"} transition`}
                />
              </Button>
            </Link>
          ))}
        </Card>
      </div>
    </>
  );
}