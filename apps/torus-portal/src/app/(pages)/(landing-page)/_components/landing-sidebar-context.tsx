"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface LandingSidebarContextProps {
  /** Whether the "View more" section is expanded (content visible) */
  isExpanded: boolean;
  /** Set the expanded state */
  setIsExpanded: (expanded: boolean) => void;
  /** Whether the sidebar panel is open (expanded width vs collapsed icons) */
  isSidebarOpen: boolean;
  /** Set the sidebar open state */
  setIsSidebarOpen: (open: boolean) => void;
  /** Toggle sidebar between open and collapsed */
  toggleSidebar: () => void;
}

const LandingSidebarContext = createContext<LandingSidebarContextProps | null>(
  null,
);

export function useLandingSidebar() {
  const context = useContext(LandingSidebarContext);
  if (!context) {
    throw new Error(
      "useLandingSidebar must be used within a LandingSidebarProvider",
    );
  }
  return context;
}

export function LandingSidebarProvider({ children }: { children: ReactNode }) {
  // Whether the landing page content is expanded (scrolled down)
  const [isExpanded, setIsExpanded] = useState(false);
  // Whether the sidebar panel is open (showing full menu) or collapsed (icons only)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const value = useMemo<LandingSidebarContextProps>(
    () => ({
      isExpanded,
      setIsExpanded,
      isSidebarOpen,
      setIsSidebarOpen,
      toggleSidebar,
    }),
    [isExpanded, isSidebarOpen],
  );

  return (
    <LandingSidebarContext.Provider value={value}>
      {children}
    </LandingSidebarContext.Provider>
  );
}
