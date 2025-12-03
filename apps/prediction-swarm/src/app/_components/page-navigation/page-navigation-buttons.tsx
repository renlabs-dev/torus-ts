"use client";

import { env } from "~/env";
import { useSearchStore } from "~/store/search-store";
import { Search } from "lucide-react";
import AddAccountStepperDialog from "../add-account-stepper-dialog";
import { WalletDropdown } from "../wallet-dropdown";
import { PageNavigationDropdownMenu } from "./page-navigation-dropdown-menu";

export function PageNavigationButtons() {
  const openSearch = useSearchStore((state) => state.open);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={openSearch}
        className="bg-background/80 border-border hover:bg-background/40 animate-fade-down animate-delay-700 flex h-8 w-8 items-center justify-center border text-white/80 transition"
      >
        <Search className="!h-4 !w-4" />
      </button>
      <AddAccountStepperDialog />
      <PageNavigationDropdownMenu />
      <WalletDropdown
        variant="icon"
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      />
    </div>
  );
}
