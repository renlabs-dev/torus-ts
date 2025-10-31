"use client";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@torus-ts/ui/components/navigation-menu";
import { cn } from "@torus-ts/ui/lib/utils";
import Link from "next/link";
import DecryptedText from "./decrypted-text";

export function Header({ className }: { className?: string }) {
  const navigationItemsLeft = [
    // { label: "HOME", href: "/" },
    { label: "DASHBOARD", href: "/dashboard", target: "_self" },
  ];
  const navigationItemsRight = [
    // { label: "ABOUT", href: "?about" },
    {
      label: "PORTAL",
      href: "https://portal.torus.network/",
      target: "_blank",
    },
  ];

  const allNavigationItems = [...navigationItemsLeft, ...navigationItemsRight];

  return (
    <header
      className={cn(
        className,
        "fixed top-0 z-50 flex h-20 w-full items-center justify-center",
      )}
    >
      {/* Desktop Navigation */}
      <div className="hidden items-center gap-10 pr-7 font-extralight md:flex">
        <div className="flex items-center gap-10">
          {navigationItemsLeft.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              target={item.target}
              className="text-muted-foreground"
            >
              <DecryptedText
                text={item.label}
                animateOn="hover"
                useOriginalCharsOnly
              />
            </Link>
          ))}
        </div>
        <h3 className="cursor-pointer text-xl tracking-[0.25em]">
          <Link href="/">
            <DecryptedText
              speed={70}
              text="PREDICTION SWARM"
              animateOn="hover"
              useOriginalCharsOnly
            />
          </Link>
        </h3>
        <div className="flex items-center gap-10">
          {navigationItemsRight.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              target={item.target}
              className="text-muted-foreground"
            >
              <DecryptedText
                text={item.label}
                animateOn="hover"
                useOriginalCharsOnly
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Navigation */}
      <NavigationMenu className="md:hidden">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger className="bg-transparent">
              <h3 className="ml-5 text-xl tracking-[0.25em]">
                <DecryptedText
                  speed={70}
                  text="PREDICTION SWARM"
                  animateOn="hover"
                  useOriginalCharsOnly
                />
              </h3>
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-3 p-4">
                {allNavigationItems.map((item) => (
                  <li key={item.label}>
                    <NavigationMenuLink asChild>
                      <Link href={item.href}>
                        <div className="text-muted-foreground text-sm font-extralight leading-none">
                          <DecryptedText
                            text={item.label}
                            animateOn="hover"
                            useOriginalCharsOnly
                          />
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
