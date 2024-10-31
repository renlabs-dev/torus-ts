"use client";

import * as React from "react";
import Link from "next/link";
import { CaretSortIcon, HamburgerMenuIcon } from "@radix-ui/react-icons";
import { ScrollArea } from "@radix-ui/react-scroll-area";

import { Button } from "./button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";
import { FooterContent } from "./footer";
import { Sheet, SheetContent, SheetTrigger } from "./sheet";

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
        <div className="mt-1 flex items-center">
          <span className="font-bold">Navigation Menu</span>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] py-6 pl-1">
          <div className="flex flex-col space-y-3">
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
                      className="block px-2 py-1 text-sm"
                    >
                      {item.title}
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
                      className="block px-2 py-1 text-sm"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
        <div className="absolute bottom-0 mb-5 mr-6 w-fit rounded-md border bg-background p-3">
          <FooterContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}
