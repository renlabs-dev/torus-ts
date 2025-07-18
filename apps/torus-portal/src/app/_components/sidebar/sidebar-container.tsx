import type { ReactNode } from "react";

import { Separator } from "@torus-ts/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@torus-ts/ui/components/sidebar";

import { PortalWalletDropdown } from "~/app/_components/portal-wallet-dropdown";
import { AppSidebar } from "~/app/_components/sidebar/app-sidebar";
import { SidebarBreadcrumb } from "~/app/_components/sidebar/sidebar-breadcrumb";

export default function SidebarContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header
          className="sticky top-0 flex h-16 shrink-0 items-center gap-2 justify-between z-50
            sm:bg-transparent bg-background"
        >
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <SidebarBreadcrumb />
          </div>
          <div className="flex items-center gap-2 px-4 w-full sm:w-fit">
            <PortalWalletDropdown />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
