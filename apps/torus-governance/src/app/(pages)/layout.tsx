"use client";

import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Container } from "@torus-ts/ui/components/container";
import { env } from "~/env";
import { SidebarInfo } from "../_components/sidebar/sidebar-info";
import { SidebarNav } from "../_components/sidebar/sidebar-nav";

export const metadata = createSeoMetadata({
  title: "Torus Governance Dashboard",
  description: "Access governance features, view proposals, and participate in DAO decisions on the Torus Network.",
  keywords: ["governance dashboard", "dao management", "proposal voting", "network governance"],
  ogSiteName: "Torus Governance",
  canonical: "/",
  baseUrl: env("BASE_URL"),
});

export default function PagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container>
      <main className="animate-fade-down mb-6 flex w-full flex-col gap-4 lg:flex-row">
        <div className="flex w-full flex-row gap-4 md:flex-col lg:w-2/5 lg:max-w-[320px]">
          <div className="flex w-full gap-4">
            <SidebarNav />
          </div>
          <SidebarInfo />
        </div>
        {children}
      </main>
    </Container>
  );
}
