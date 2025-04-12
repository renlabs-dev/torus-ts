"use client";

import { SidebarNav, NavOption } from "@torus-ts/ui/components/sidebar";
import { env } from "~/env";
import { usePathname } from "next/navigation";

export const SidebarLinks = () => {
  const chainEnv = env("NEXT_PUBLIC_TORUS_CHAIN_ENV");
  const pathname = usePathname();

  const bridgeLink =
    chainEnv === "mainnet"
      ? "https://bridge.torus.network"
      : "https://bridge.testnet.torus.network";

  const navOptions: NavOption[] = [
    { title: "Wallet", href: "/" },
    { title: "Staking", href: "/staking" },
    { title: "Bridge", href: bridgeLink },
  ];

  const isActive = (href: string, path: string) => {
    if (href === path) return true;
    return false;
  };
  
  return (
    <SidebarNav 
      navOptions={navOptions}
      defaultOption={navOptions[0]}
      isActive={isActive}
    />
  );
};
