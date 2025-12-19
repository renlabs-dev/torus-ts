"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import SidebarContainer from "./sidebar-container";

/**
 * Conditionally renders the SidebarContainer based on the current route.
 * The sidebar appears on all pages EXCEPT the landing page ("/").
 */
export function ConditionalSidebar({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Landing page doesn't use the standard sidebar
  // It has its own custom sidebar implementation
  const isLandingPage = pathname === "/";

  if (isLandingPage) {
    return <>{children}</>;
  }

  return <SidebarContainer>{children}</SidebarContainer>;
}
