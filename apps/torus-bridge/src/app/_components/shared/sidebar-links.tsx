"use client";

import type { NavOption } from "@torus-ts/ui/components/sidebar-nav";
import { SidebarNav } from "@torus-ts/ui/components/sidebar-nav";
import { getLinks } from "@torus-ts/ui/lib/data";
import { env } from "~/env";
import { Suspense } from "react";

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

const navSidebarOptions: NavOption[] = [
  { title: "Wallet", href: links.wallet },
  { title: "Base Bridge", href: "/" },
];

export function Sidebar() {
  const isActive = (href: string, _path: string) => {
    return href === "/" ? true : false;
  };

  return (
    <Suspense>
      <SidebarNav
        navOptions={navSidebarOptions}
        defaultOption={navSidebarOptions[1]}
        isActive={isActive}
      />
    </Suspense>
  );
}
