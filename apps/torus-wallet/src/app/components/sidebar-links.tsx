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
import { Check } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { env } from "~/env";

interface NavLink {
  path: string;
  label: string;
  value: string;
}

interface MobileSelectProps {
  onValueChange: (value: string) => void;
  defaultValue: string;
  pathname: string;
}

type NavButtonProps = NavLink;

const NAVIGATION_LINKS: NavLink[] = [
  { path: "/transfers", label: "Wallet", value: "wallet" },
  { path: "/staking", label: "Staking", value: "staking" },
  { path: "bridge", label: "Bridge", value: "bridge" },
];

const useNavigation = () => {
  const chainEnv = env("NEXT_PUBLIC_TORUS_CHAIN_ENV");
  const bridgeLink = getLinks(chainEnv).bridge;
  const pathname = usePathname();

  const isActive = (path: string): boolean => pathname === path;

  const getPath = (value: string): string =>
    value === "bridge" ? bridgeLink : `/${value === "wallet" ? "" : value}`;

  const getDefaultValue = (): string => {
    if (pathname === "/") return "wallet";
    if (pathname === "/transfers") return "wallet";
    if (pathname === "/staking") return "staking";
    if (pathname.includes("bridge")) return "bridge";
    return pathname.slice(1);
  };

  return {
    isActive,
    getPath,
    getDefaultValue,
    bridgeLink,
    pathname,
  };
};

function NavButton({ path, label, value }: NavButtonProps) {
  const { isActive, bridgeLink } = useNavigation();

  return (
    <Button
      key={value}
      asChild
      variant="ghost"
      className={`w-full justify-between gap-4 border-none ${isActive(path) ? "bg-accent" : ""}
        px-3 text-base`}
    >
      <Link href={value === "bridge" ? bridgeLink : path}>
        {label}
        {isActive(path) && <Check size={16} />}
      </Link>
    </Button>
  );
}

function MobileSelect({
  onValueChange,
  defaultValue,
  pathname,
}: MobileSelectProps) {
  return (
    <Select onValueChange={onValueChange} defaultValue={defaultValue}>
      <SelectTrigger className="w-full lg:hidden my-4">
        <SelectValue placeholder="Select a view" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {NAVIGATION_LINKS.map(({ value, label, path }) => (
            <SelectItem
              key={value}
              value={value}
              className={pathname === path ? "bg-accent" : ""}
            >
              {label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export const SidebarLinks = () => {
  const router = useRouter();
  const { getPath, getDefaultValue, pathname } = useNavigation();

  const handleSelectChange = (value: string): void => {
    router.push(getPath(value));
  };

  return (
    <>
      <MobileSelect
        onValueChange={handleSelectChange}
        defaultValue={getDefaultValue()}
        pathname={pathname}
      />

      <div className="hidden max-h-fit w-full min-w-fit flex-col gap-6 lg:flex">
        <Card className="flex flex-col gap-1.5 p-5">
          {NAVIGATION_LINKS.map((navLinkProps) => (
            <NavButton key={navLinkProps.value} {...navLinkProps} />
          ))}
        </Card>
      </div>
    </>
  );
};
