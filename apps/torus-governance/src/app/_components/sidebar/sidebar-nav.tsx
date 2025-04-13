"use client";

import type { NavOption } from "@torus-ts/ui/components/sidebar-nav";
import { SidebarNav as SharedSidebarNav } from "@torus-ts/ui/components/sidebar-nav";

const navOptions: NavOption[] = [
  { title: "Whitelist Applications", href: "/whitelist-applications" },
  { title: "Proposals", href: "/proposals" },
  { title: "DAO Portal", href: "/dao-portal" },
  { title: "Agents", href: "/agents" },
];

export type GovernanceViewMode = (typeof navOptions)[number]["href"];

export function SidebarNav() {
  const isActive = (href: string, path: string) =>
    path === href || (href === "/" && path === "/agent-applications");

  return (
    <SharedSidebarNav
      navOptions={navOptions}
      isActive={isActive}
      animationClass="animate-fade-up animate-delay-200"
    />
  );
}
