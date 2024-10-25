"use client";

import type { ReactElement } from "react";
import React, { useState } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/16/solid";

import { cn, links } from "..";

interface MobileNavigationProps {
  navigationLinks?: { name: string; href: string; external: boolean }[];
  genericContent?: ReactElement;
}

export function MobileNavigation(props: MobileNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  const headerSocialLinks = [
    {
      href: links.discord,
      icon: "/discord-icon.svg",
      alt: "torus's Discord Link",
    },
    {
      href: links.github,
      icon: "/github-icon.svg",
      alt: "torus's GitHub Link",
    },
    {
      href: links.telegram,
      icon: "/telegram-icon.svg",
      alt: "torus's Telegram Link",
    },
    {
      href: links.x,
      icon: "/x-icon.svg",
      alt: "torus's X Link",
    },
  ];

  return (
    <div className={cn("z-50")}>
      <button
        type="button"
        className={cn(
          "ml-2 flex h-11 w-11 items-center justify-center border border-gray-500 p-2 text-white hover:bg-gray-400/[0.10] lg:hidden",
        )}
        onClick={toggleMobileMenu}
      >
        {mobileMenuOpen ? (
          <XMarkIcon className={cn("h-6 w-6 text-gray-500")} />
        ) : (
          <Bars3Icon className={cn("h-6 w-6 text-gray-500")} />
        )}
      </button>

      {mobileMenuOpen && (
        <nav
          className={cn("absolute right-0 top-20 z-40 h-full w-full lg:hidden")}
        >
          <div
            className={cn(
              "min-w-1/4 sticky right-3 top-3 z-[50] ml-auto h-auto w-[70%] border border-white/20 bg-[url('/bg-pattern.svg')] lg:w-[30%]",
            )}
          >
            <div className={cn("flow-root")}>
              {props.genericContent}

              <div className={cn("space-y-2 border-white/20 p-4")}>
                {props.navigationLinks?.map(({ name, href, external }) => (
                  <a
                    key={name}
                    href={href}
                    onClick={toggleMobileMenu}
                    target={external ? "_blank" : "_self"}
                    className={cn(
                      "block w-full border border-white/20 p-3 px-6 text-center text-base font-semibold leading-7 text-gray-400 hover:border-green-600 hover:bg-green-600/5 hover:text-green-600 hover:backdrop-blur-sm",
                    )}
                  >
                    {name}
                  </a>
                ))}
              </div>

              <div
                className={cn(
                  "flex w-full justify-between border-t border-white/20 p-6 py-4 text-green-500",
                )}
              >
                {headerSocialLinks.map((value) => {
                  return (
                    <a key={value.href} href={value.href} target="_blank">
                      <img
                        src={value.icon}
                        alt={`${value.alt} Icon`}
                        width={40}
                        height={40}
                        className={cn("h-8 w-8")}
                      />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
