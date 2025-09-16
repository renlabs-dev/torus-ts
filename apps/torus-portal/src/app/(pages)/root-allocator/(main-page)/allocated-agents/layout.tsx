import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Allocated Agents - Torus Portal",
    description: "View agents you have allocated weights.",
    keywords: [
      "allocated agents",
      "agent allocations",
      "weight distribution",
      "allocation management",
      "delegated agents",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/root-allocator/allocated-agents",
    baseUrl: env("BASE_URL"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
