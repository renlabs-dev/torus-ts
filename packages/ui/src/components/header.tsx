import type { ReactElement } from "react";
import * as React from "react";
import Link from "next/link";

import {
  cn,
  MobileNavigation,
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
  {
    title: "Home Page",
    href: "/",
    description: "Visit the Torus home page to understand how to get started.",
  },
];

export function Header(props: HeaderProps): JSX.Element {
  return (
    <header
      className={cn(
        "fixed left-6 right-6 top-6 z-50 mx-auto flex max-w-screen-2xl animate-fade-down rounded-md border border-white/20 bg-[#898989]/5 backdrop-blur-md",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-between px-3 py-3",
        )}
      >
        <a className={cn("flex items-center gap-3")} href="/">
          <img
            alt="Logo"
            className={cn("h-10 w-10")}
            height={100}
            src={props.logoSrc}
            width={100}
          />
          <h3
            className={cn(
              props.font,
              "mt-0.5 hidden text-2xl font-light text-white md:flex",
            )}
          >
            {props.title}
          </h3>
        </a>

        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <Icons.logo className="h-6 w-6" />
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Torus
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          Peer-to-peer Incentivized coordination network.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/join" title="Join Community">
                    Be a part of the Torus community.
                  </ListItem>
                  <ListItem href="/paper" title="Whitepaper">
                    Learn the protocol fundamental structure and principles.
                  </ListItem>
                  <ListItem href="/bridge" title="Bridge">
                    Bridge your assets to the Torus network.
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
          </NavigationMenuList>
        </NavigationMenu>
      </div>
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
