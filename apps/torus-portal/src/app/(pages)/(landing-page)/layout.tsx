import type { ReactNode } from "react";

/**
 * Landing page layout.
 * The ConditionalSidebar in the parent layout handles excluding the standard
 * sidebar for this route; the landing page navigates solely through the
 * logo nav tree in the hover header.
 */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
