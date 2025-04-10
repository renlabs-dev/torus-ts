"use client";

import { Container } from "@torus-ts/ui/components/container";
import { SidebarInfo } from "../_components/sidebar/sidebar-info";
import { SidebarNav } from "../_components/sidebar/sidebar-nav";

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
