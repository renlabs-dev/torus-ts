import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Portal",
    description: "The thermodynamic god's favorite portal.",
    keywords: [
      "permission graph",
      "network visualization",
      "agent relationships",
      "permission mapping",
      "network explorer",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/permission-graph",
    baseUrl: env("BASE_URL"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
