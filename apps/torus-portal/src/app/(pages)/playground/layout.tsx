import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Playground - Torus Portal",
    description: "Internal testing page.",
    keywords: [
      "blockchain playground",
      "test transactions",
      "remark transactions",
      "network testing",
      "blockchain experiments",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/playground",
    baseUrl: env("BASE_URL"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
