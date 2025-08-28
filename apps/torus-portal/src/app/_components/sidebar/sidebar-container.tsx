import { Separator } from "@torus-ts/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@torus-ts/ui/components/sidebar";
import { PortalWalletDropdown } from "~/app/_components/portal-wallet-dropdown";
import { AppSidebar } from "~/app/_components/sidebar/app-sidebar";
import { SidebarBreadcrumb } from "~/app/_components/sidebar/sidebar-breadcrumb";
import type { ReactNode } from "react";

export default function SidebarContainer({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-2 sm:bg-transparent">
          <div className="flex w-full items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <SidebarBreadcrumb />
          </div>
          <div className="flex w-fit items-center text-nowrap px-2 sm:px-4">
            <PortalWalletDropdown />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
