import * as React from "react";
import Link from "next/link";
import { Icons } from "node_modules/@torus-ts/ui/src/components/icons";

import {
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@torus-ts/ui";

interface HeaderDesktopProps {
  items: { title: string; href: string }[];
  apps: { title: string; href: string; description: string }[];
  start: { title: string; href: string; description: string }[];
}

export function HeaderDesktop({
  apps,
  start,
  items,
}: HeaderDesktopProps): JSX.Element {
  return (
    <NavigationMenu className="hidden md:block">
      <NavigationMenuList>
        {items.map((item) => (
          <NavigationMenuItem key={item.title}>
            <Link href={item.href} legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                {item.title}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Start</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/30 to-muted/50 p-6 no-underline outline-none focus:shadow-md"
                    href="/"
                  >
                    <Icons.logo className="h-8 w-8" />
                    <div className="mb-2 mt-4 text-lg font-medium">Torus</div>
                    <p className="text-sm leading-tight text-muted-foreground">
                      Self-assembling P2P organism. Multi-graph of delegated
                      permissions & incentives between agents.
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {start.map((item) => (
                <ListItem key={item.title} title={item.title} href={item.href}>
                  {item.description}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Apps</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="relative">
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {apps.map((app) => (
                  <ListItem key={app.title} title={app.title} href={app.href}>
                    {app.description}
                  </ListItem>
                ))}
              </ul>
              <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                <span className="text-lg font-bold text-white">
                  Coming Soon
                </span>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className,
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
