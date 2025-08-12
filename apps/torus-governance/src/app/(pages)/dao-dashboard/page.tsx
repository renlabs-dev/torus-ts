import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import DaoDashboardPageClient from "./_components/dao-dashboard-page-client";

export const metadata = () =>
  createSeoMetadata({
    title: "DAO Dashboard - Torus Governance",
    description:
      "Monitor DAO operations, agent health, and applications. Comprehensive dashboard for Torus Network governance management.",
    keywords: [
      "dao dashboard",
      "agent health",
      "dao applications",
      "governance monitoring",
      "network status",
    ],
    ogSiteName: "Torus Governance",
    canonical: "/dao-dashboard",
    baseUrl: env("BASE_URL"),
  });

export default function DaoDashboardPage() {
  return <DaoDashboardPageClient />;
}
