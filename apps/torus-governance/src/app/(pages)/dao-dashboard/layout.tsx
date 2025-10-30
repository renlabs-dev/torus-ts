import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";

export function generateMetadata() {
  return createSeoMetadata({
    title: "DAO Dashboard - Torus Governance",
    description:
      "Monitor DAO operations, agent health, and root agent applications.",
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
}

export default function DaoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
