import { env } from "~/env";
import { WalletDropdown } from "./wallet-dropdown";
import { NavigationMenuDropdown } from "./navigation-menu-dropdown";

export function NavigationItems() {
  return (
    <div className="flex items-center gap-2">
      <NavigationMenuDropdown />
      <WalletDropdown
        variant="icon"
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      />
    </div>
  );
}
