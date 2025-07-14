"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@torus-ts/ui/components/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    items?: {
      title: string;
      url: string;
      icon: LucideIcon;
    }[];
  }[];
}) {
  return (
    <div>
      {items.map((item) => (
        <SidebarGroup key={item.title}>
          {item.title && <SidebarGroupLabel>{item.title}</SidebarGroupLabel>}
          <SidebarMenu>
            {item.items?.map((subItem) => (
              <SidebarMenuItem key={subItem.title}>
                <SidebarMenuButton asChild tooltip={subItem.title}>
                  <Link href={subItem.url} prefetch={false}>
                    <subItem.icon />
                    <span>{subItem.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </div>
  );
}
