"use client";

import * as React from "react";

import {
  FolderPen,
  Frame,
  Grid2x2Plus,
  LifeBuoy,
  Map,
  PieChart,
  Plus,
  Send,
} from "lucide-react";
import Link from "next/link";

import { Icons } from "@torus-ts/ui/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@torus-ts/ui/components/sidebar";

import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavSecondary } from "./nav-secondary";

const data = {
  navMain: [
    {
      title: "Permissions",
      icon: Plus,
      isActive: true,
      items: [
        {
          title: "Create Permission",
          url: "/create-permission",
        },
        {
          title: "Edit Permission",
          url: "/edit-permission",
        },
      ],
    },
    {
      title: "Capabilitys",
      icon: FolderPen,
      isActive: true,
      items: [
        {
          title: "Register Capability",
          url: "/register-capability",
        },
        {
          title: "Delete Capability",
          url: "/delete-capability",
        },
      ],
    },
    {
      title: "Network Operations",
      icon: Grid2x2Plus,
      isActive: true,
      items: [
        {
          title: "Register Agent",
          url: "/register-agent",
        },
        {
          title: "Create Signal",
          url: "/create-signal",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  test: [
    {
      name: "Testing",
      url: "#",
      icon: Frame,
    },
    {
      name: "Mfs",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Hello uwu",
      url: "#",
      icon: Map,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div
                  className="text-sidebar-primary-foreground flex aspect-square size-8 items-center
                    justify-center rounded-lg"
                >
                  <Icons.Logo className="size-6" />
                </div>
                <div className="grid flex-1 text-left text-base leading-tight">
                  <span className="truncate font-medium">Torus Portal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.test} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{/* TODO: Footer */}</SidebarFooter>
    </Sidebar>
  );
}
