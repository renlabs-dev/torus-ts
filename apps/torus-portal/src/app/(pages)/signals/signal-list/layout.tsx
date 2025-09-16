import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Signal List - Torus Portal",
    description:
      "View active Signals, their status, and their associated agents.",
    keywords: [
      "signal list",
      "demand signals",
      "network signals",
      "signal management",
      "signal status",
    ],
    ogSiteName: "Torus Portal",
    canonical: "/signals/signal-list",
    baseUrl: env("BASE_URL"),
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
