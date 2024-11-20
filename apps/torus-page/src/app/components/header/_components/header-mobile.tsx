"use client";

import * as React from "react";
import Link from "next/link";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { Icons } from "node_modules/@torus-ts/ui/src/components/icons";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  links,
  ScrollArea,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@torus-ts/ui";

interface HeaderMobileProps {
  items: { title: string; href: string }[];
  apps: { title: string; href: string; description: string }[];
  start: { title: string; href: string; description: string }[];
}

export function HeaderMobile({ items, apps, start }: HeaderMobileProps) {
  const [open, setOpen] = React.useState(false);
  const [openStarting, setOpenStarting] = React.useState(false);
  const [openApps, setOpenApps] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-6 mt-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <HamburgerMenuIcon className="h-7 w-7" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="pr-0">
        <div className="flex items-center">
          <Icons.logo className="mr-1.5 h-7 w-7" />
          <span className="mt-0.5 font-bold">Torus</span>
        </div>
        <ScrollArea className="my-4 mr-2 h-[calc(100vh-10rem)] py-6 pl-1">
          <div className="mb-24 flex flex-col space-y-3">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setOpen(false);
                }}
              >
                {item.title}
              </Link>
            ))}

            <Collapsible
              open={openStarting}
              onOpenChange={setOpenStarting}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Getting started</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <CaretSortIcon className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent asChild>
                <div className="mt-2 space-y-2">
                  {start.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                      }}
                      className="flex flex-col px-2 py-1 text-sm"
                    >
                      <span className="mb-0.5 font-bold underline">
                        {item.title}
                      </span>
                      <span className="text-muted-foreground">
                        {item.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible
              open={openApps}
              onOpenChange={setOpenApps}
              className="w-full"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">Applications</h4>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <CaretSortIcon className="h-4 w-4" />
                    <span className="sr-only">Toggle</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent asChild>
                <div className="mt-2 space-y-2">
                  {apps.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                      }}
                      className="flex flex-col px-2 py-1 text-sm"
                    >
                      <span className="mb-0.5 font-bold underline">
                        {item.title}
                      </span>
                      <span className="text-muted-foreground">
                        {item.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <div className="absolute bottom-0 bg-gradient-to-t from-[#090C20] via-[#090C20] to-transparent p-3 pb-6 pt-24">
          <div className="mb-3 flex items-center justify-start space-x-6 md:space-x-3">
            {socialList.map((social) => {
              return (
                <a key={social.name} href={social.href}>
                  {social.icon}
                </a>
              );
            })}
          </div>
          <p className="text-start">
            Made by the community, powered by{" "}
            <Link href="/" className="text-cyan-200 underline">
              Ren Labs
            </Link>
            .
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const socialList = [
  {
    name: "Discord",
    href: links.discord,
    icon: <Icons.discord className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
  {
    name: "X",
    href: links.x,
    icon: <Icons.x className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
  {
    name: "GitHub",
    href: links.github,
    icon: <Icons.github className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
  {
    name: "Telegram",
    href: links.telegram,
    icon: <Icons.telegram className="h-6 w-6 md:h-3.5 md:w-3.5" />,
  },
];
