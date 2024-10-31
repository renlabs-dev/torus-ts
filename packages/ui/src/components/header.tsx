import { cn, navApps, navItems, navStart } from "..";
import { HeaderDesktop } from "./header-desktop";
import { HeaderMobile } from "./header-mobile";

export function Header(): JSX.Element {
  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 mx-auto flex animate-fade-down justify-end bg-gradient-to-b from-[#020518] via-[#020518] to-transparent pb-6 pt-3 md:justify-center",
      )}
    >
      <HeaderDesktop apps={navApps} start={navStart} items={navItems} />
      <HeaderMobile apps={navApps} start={navStart} items={navItems} />
    </header>
  );
}
