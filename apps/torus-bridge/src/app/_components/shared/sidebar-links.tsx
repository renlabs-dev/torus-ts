"use client";

import { SidebarNav } from "@torus-ts/ui/components/sidebar";
import { getLinks } from "@torus-ts/ui/lib/data";
import { env } from "~/env";
import { Suspense } from "react";

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

const navSidebarOptions = [
  { title: "Wallet", href: links.wallet },
  { title: "Base Bridge", href: "/" },
] as const;

const Sidebar = () => {
  // Custom isActive check for bridge - only the Bridge link is active
  const isActive = (href: string, _path: string) => {
    return href === "/" ? true : false;
  };

  return (
    <SidebarNav 
      navOptions={navSidebarOptions}
      defaultOption={navSidebarOptions[1]}
      isActive={isActive}
    />
  );
};

export const SidebarLinks = () => {
  return (
    <Suspense>
      <Sidebar />
    </Suspense>
  );
};
