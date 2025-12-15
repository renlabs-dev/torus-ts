import type { ReactNode } from "react";

/**
 * Landing page layout.
 * The ConditionalSidebar in the parent layout handles excluding the standard
 * sidebar for this route. The landing page has its own custom sidebar
 * implementation that appears as an absolute overlay when the user scrolls down.
 */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
