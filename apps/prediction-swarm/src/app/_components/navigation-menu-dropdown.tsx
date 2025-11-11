"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";

export function NavigationMenuDropdown() {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="bg-background/80 border-border hover:bg-background/40 flex h-8 w-8 items-center justify-center border text-white/80 transition duration-200">
          <Menu className="!h-4 !w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/")}>
            Home
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/feed")}>
            Prediction Feed
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/top-predictors")}>
            Top Predictors
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/tickers")}>
            Tickers
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuLabel className="text-muted-foreground text-xs">
          System
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push("/scraper-queue")}>
            Scraper Queue
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
