import { Suspense } from "react";

import { cn, navApps, navItems, navStart } from "@torus-ts/ui";

import { Bridge } from "../bridge";
import { HeaderDesktop } from "./_components/header-desktop";
import { HeaderMobile } from "./_components/header-mobile";

export function Header(): JSX.Element {
  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex animate-fade-down flex-col items-center justify-center bg-gradient-to-b from-[#020518] via-[#020518] to-transparent pb-6",
      )}
    >
      <Suspense fallback="...loading">
        <Bridge />
      </Suspense>
      <HeaderDesktop apps={navApps} start={navStart} items={navItems} />
      <HeaderMobile apps={navApps} start={navStart} items={navItems} />
    </header>
  );
}
