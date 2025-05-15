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
import { usePathname, useRouter } from "next/navigation";
import { TransactionsSheet } from "../_components/transactions-sheet/transactions-sheet";

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
  { path: "/", label: "Wallet", value: "wallet" },
  { path: "/staking", label: "Staking", value: "staking" },
  { path: "/bridge", label: "Bridge", value: "bridge" },
];

const useNavigation = () => {
  const chainEnv = env("NEXT_PUBLIC_TORUS_CHAIN_ENV");
  const bridgeLink = getLinks(chainEnv).bridge;
  const pathname = usePathname();

  const isActive = (path: string): boolean => {
    // For root path, ensure it's exactly "/" to avoid matching with other paths
    if (path === "/") {
      return pathname === "/" || pathname.startsWith("/(transfers)");
    }
    return pathname.startsWith(path);
  };

  const getPath = (value: string): string =>
    value === "bridge" ? bridgeLink : `/${value === "wallet" ? "" : value}`;

  const getDefaultValue = (): string => {
    const pathMap: Record<string, string> = {
      "/": "wallet",
      "/staking": "staking",
    };

    if (pathname === "/bridge" || pathname.startsWith(bridgeLink)) {
      return "bridge";
    }

    return pathMap[pathname] ?? pathname.slice(1);
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
      <SelectTrigger
        className="my-4 w-full lg:hidden"
        aria-label="Navigation options"
      >
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
          <TransactionsSheet />
        </Card>
      </div>
    </>
  );
};
