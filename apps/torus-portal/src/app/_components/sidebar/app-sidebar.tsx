"use client";

import * as React from "react";

import {
  Edit3,
  FolderPen,
  Frame,
  LifeBuoy,
  Map,
  Network,
  PieChart,
  Plus,
  Send,
  Signal,
  Trash2,
  UserPlus,
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
      title: "Overview",
      items: [
        {
          title: "Hypergraph",
          url: "/",
          icon: Network,
        },
      ],
    },
    {
      title: "Permissions",
      items: [
        {
          title: "Create Permission",
          url: "/create-permission",
          icon: Plus,
        },
        {
          title: "Edit Permission",
          url: "/edit-permission",
          icon: Edit3,
        },
      ],
    },
    {
      title: "Capabilitys",
      items: [
        {
          title: "Register Capability",
          url: "/register-capability",
          icon: FolderPen,
        },
        {
          title: "Delete Capability",
          url: "/delete-capability",
          icon: Trash2,
        },
      ],
    },
    {
      title: "Network Operations",
      items: [
        {
          title: "Register Agent",
          url: "/register-agent",
          icon: UserPlus,
        },
        {
          title: "Create Signal",
          url: "/create-signal",
          icon: Signal,
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
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div
                  className="flex aspect-square size-8 items-center justify-center rounded-lg
                    text-sidebar-primary-foreground"
                >
                  <Icons.Logo className="size-5" />
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
