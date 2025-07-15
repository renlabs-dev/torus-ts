import * as React from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@torus-ts/ui/components/sidebar";
import { cn } from "@torus-ts/ui/lib/utils";

export function NavSocials({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { state } = useSidebar();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu
          className={cn(
            "flex w-full justify-around",
            state === "expanded" ? "flex-row px-2" : "flex-col",
          )}
        >
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <a href={item.url} target="_blank">
                  <item.icon />
                  {/* <span>{item.title}</span> */}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
