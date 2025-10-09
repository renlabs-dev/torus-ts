"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

import DecryptedText from "./decrypted-text";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

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
        "w-full flex items-center justify-center fixed top-0 z-50 h-20"
      )}
    >
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-10 font-extralight pr-7">
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
        <h3 className="tracking-[0.25em] text-xl cursor-pointer">
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
              <h3 className="tracking-[0.25em] text-xl ml-5">
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
                        <div className="text-sm font-extralight leading-none text-muted-foreground">
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
