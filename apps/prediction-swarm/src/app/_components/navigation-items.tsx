"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { env } from "~/env";
import { useSearchStore } from "~/store/search-store";
import { Search } from "lucide-react";
import AddAccountStepperDialog from "./add-account-stepper-dialog";
import { NavigationMenuDropdown } from "./navigation-menu-dropdown";
import { WalletDropdown } from "./wallet-dropdown";

export function NavigationItems() {
  const openSearch = useSearchStore((state) => state.open);

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={openSearch}
            className="bg-background/80 border-border hover:bg-background/40 animate-fade-down animate-delay-700 flex h-8 w-8 items-center justify-center border text-white/80 transition"
          >
            <Search className="!h-4 !w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-background/80 text-white">
          Search for accounts in swarm
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex">
            <AddAccountStepperDialog />
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-background/80 text-white">
          Add an 𝕏 account's
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex">
            <NavigationMenuDropdown />
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-background/80 text-white">
          Browse sections
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="flex">
            <WalletDropdown
              variant="icon"
              torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
            />
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-background/80 text-white">
          Manage wallet connection
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
