import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "2D Hypergraph - Torus Portal",
    description: "Network 2D visualization with advanced graph features.",
    keywords: [
      "2d hypergraph",
      "network visualization",
      "permission graph",
      "interactive graph",
      "hypergraph visualization",
      "network exploration",
    ],
    ogSiteName: "Torus Portal",
    canonical: "portal/2d-hypergraph",
    baseUrl: env("BASE_URL"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
