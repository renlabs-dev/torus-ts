import type { ReactElement } from "react";
import * as React from "react";
import Link from "next/link";

import {
  cn,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "..";
import { Icons } from "./icons";

export interface NextFont {
  className: string;
  style: {
    fontFamily: string;
    fontWeight?: number;
    fontStyle?: string;
  };
}

interface HeaderProps {
  logoSrc: string;
  title: string;
  navigationLinks?: { name: string; href: string; external: boolean }[];
  wallet?: JSX.Element;
  mobileContent?: ReactElement;
  font: NextFont["className"];
}

const apps: { title: string; href: string; description: string }[] = [
  {
    title: "Bridge",
    href: "/",
    description: "Bridge your assets to the Torus network.",
  },
  {
    title: "Governance Portal",
    href: "/",
    description:
      "Participate in the governance of the Torus network and earn rewards.",
  },
  {
    title: "Consensus Subnet Portal",
    href: "/",
    description:
      "Allocate resources to modules and subnets curated by the DAO.",
  },
  {
    title: "Documentation",
    href: "/",
    description: "Learn how to use the Torus network.",
  },
  {
    title: "Web Wallet",
    href: "/",
    description: "Manage your assets with secure and decentralized wallet.",
  },
  {
    title: "Blog",
    href: "/",
    description: "Stay updated with the latest news and updates.",
  },
];

export function Header(props: HeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "fixed left-6 right-6 top-3 z-50 mx-auto flex max-w-screen-2xl animate-fade-down justify-center",
      )}
    >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                <li className="row-span-3">
                  <NavigationMenuLink asChild>
                    <a
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/30 to-muted/50 p-6 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      <Icons.logo className="h-8 w-8" />
                      <div className="mb-2 mt-4 text-lg font-medium">Torus</div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Protocol and Market System for Incentive-driven
                        Coordination of Decentralized AI.
                      </p>
                    </a>
                  </NavigationMenuLink>
                </li>
                <ListItem href="/about" title="View More">
                  Learn more about Torus.
                </ListItem>
                <ListItem href="/join" title="Join Community">
                  Be a part of the Torus community.
                </ListItem>
                <ListItem href="/paper" title="Whitepaper">
                  Learn the protocol fundamental structure and principles.
                </ListItem>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Applications</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                {apps.map((app) => (
                  <ListItem key={app.title} title={app.title} href={app.href}>
                    {app.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/docs" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Documentation
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href="/" legacyBehavior passHref>
              <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
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
