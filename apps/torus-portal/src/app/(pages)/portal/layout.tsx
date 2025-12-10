import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import type { ReactNode } from "react";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Portal",
    description:
      "Manage network permissions, agent allocations, and explore the hypergraph.",
    keywords: [
      "torus portal",
      "permission management",
      "agent allocation",
      "network governance",
      "web3 platform",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/",
    baseUrl: env("BASE_URL"),
  });
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
