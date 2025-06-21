"use client";

import Image from "next/image";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import PortalNavigationTabs from "./portal-navigation-tabs";

interface PortalFormContainerProps {
  children: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
}

export default function PortalFormContainer({
  children,
  imageSrc = "/form-bg-signal.svg",
  imageAlt = "Abstract decorative background",
}: PortalFormContainerProps) {
  return (
    <main className="flex min-h-svh">
      <div className="fixed top-[3.9rem] left-2 z-10 max-w-fit">
        <PortalNavigationTabs />
      </div>

      <div className="relative bg-card hidden lg:block w-[60%] animate-fade-down animate-delay-300">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 bg-card animate-fade-down">
        <ScrollArea className="flex-1 h-svh">
          <div className="flex items-center justify-center pt-16">
            {children}
          </div>
        </ScrollArea>
      </div>
    </main>
  );
}
