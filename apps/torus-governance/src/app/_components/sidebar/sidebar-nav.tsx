"use client";

import { SidebarNav as SharedSidebarNav } from "@torus-ts/ui/components/sidebar";
import { usePathname } from "next/navigation";

const navOptions = [
  { title: "Whitelist Applications", href: "/whitelist-applications" },
  { title: "Proposals", href: "/proposals" },
  { title: "DAO Portal", href: "/dao-portal" },
  { title: "Agents", href: "/agents" },
] as const;

export type GovernanceViewMode = (typeof navOptions)[number]["href"];

export function SidebarNav() {
  const pathname = usePathname();

  // Custom isActive function for governance
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
