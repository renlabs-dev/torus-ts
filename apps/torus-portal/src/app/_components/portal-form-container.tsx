"use client";

import Image from "next/image";

import { ScrollArea } from "@torus-ts/ui/components/scroll-area";

import PortalNavigationTabs from "./portal-navigation-tabs";

interface PortalFormContainerProps {
  imageSrc: string;
  children: React.ReactNode;
}

export default function PortalFormContainer(props: PortalFormContainerProps) {
  return (
    <main className="flex min-h-svh">
      <div className="fixed top-[3.9rem] left-2 z-10 max-w-fit">
        <PortalNavigationTabs />
      </div>

      <div className="relative bg-card hidden lg:block w-[60%] animate-fade-down animate-delay-300">
        <Image
          src={props.imageSrc}
          alt="Portal Background"
          fill
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 bg-card animate-fade-down">
        <ScrollArea className="flex-1 h-svh">
          <div className="flex justify-center pt-24 md:pt-16 min-h-full">
            {props.children}
          </div>
        </ScrollArea>
      </div>
    </main>
  );
}
