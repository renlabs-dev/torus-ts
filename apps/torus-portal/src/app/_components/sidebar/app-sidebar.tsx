"use client";

import * as React from "react";

import {
  CircleFadingPlus,
  FilePen,
  FilePlus,
  Network,
  PackagePlus,
  PackageX,
  Radio,
  RadioTower,
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
import { getLinks } from "@torus-ts/ui/lib/data";

import { env } from "~/env";

import { NavMain } from "./nav-main";
import { NavSocials } from "./nav-socials";

const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

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
          icon: FilePlus,
        },
        {
          title: "Edit Permission",
          url: "/permissions/edit-permission",
          icon: FilePen,
        },
      ],
    },
    {
      title: "Capabilities",
      items: [
        {
          title: "Create Capability",
          url: "/capabilities/create-capability",
          icon: PackagePlus,
        },
        {
          title: "Delete Capability",
          url: "/capabilities/delete-capability",
          icon: PackageX,
        },
      ],
    },
    {
      title: "Network Operations",
      items: [
        {
          title: "Register Agent",
          url: "/network-operations/register-agent",
          icon: CircleFadingPlus,
        },
        {
          title: "Create Signal",
          url: "/signals/create-signal",
          icon: Radio,
        },
        {
          title: "View Signals",
          url: "/signals/signal-list",
          icon: RadioTower,
        },
      ],
    },
  ],
  navSocials: [
    {
      title: "GitHub",
      url: links.github,
      icon: Icons.Github,
    },
    {
      title: "Twitter",
      url: links.x,
      icon: Icons.X,
    },
    {
      title: "Discord",
      url: links.discord,
      icon: Icons.Discord,
    },
    {
      title: "Telegram",
      url: links.telegram,
      icon: Icons.Telegram,
    },
    {
      title: "Ren Labs",
      url: links.ren_labs,
      icon: Icons.LogoRenLabs,
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
        <NavSocials items={data.navSocials} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>{/* TODO: Footer */}</SidebarFooter>
    </Sidebar>
  );
}
