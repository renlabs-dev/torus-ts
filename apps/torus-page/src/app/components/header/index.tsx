import { cn, navApps, navItems, navStart } from "@torus-ts/ui";

import { HeaderDesktop } from "./_components/header-desktop";
import { HeaderMobile } from "./_components/header-mobile";

export function Header(): JSX.Element {
  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-[70] flex w-full animate-fade-down flex-col items-center justify-end bg-gradient-to-b from-background via-background to-transparent pb-6 pt-2 md:justify-center",
      )}
    >
      <HeaderDesktop apps={navApps} start={navStart} items={navItems} />
      <div className="flex w-full justify-end md:hidden">
        <HeaderMobile apps={navApps} start={navStart} items={navItems} />
      </div>
    </header>
  );
}
