import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import SidebarContainer from "../../_components/sidebar/sidebar-container";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SidebarContainer>{children}</SidebarContainer>;
}
