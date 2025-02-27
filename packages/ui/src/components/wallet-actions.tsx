"use client";

import { LogOut, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { DropdownMenuItem, DropdownMenuSeparator } from "./dropdown-menu";

import { links } from "../lib/data";
import { cn } from "../lib/utils";

interface WalletActionsProps {
  handleLogout: () => void;
}

export const WalletActions = ({ handleLogout }: WalletActionsProps) => (
  <>
    <DropdownMenuSeparator />
    <DropdownMenuItem className={cn("cursor-pointer")}>
      <Link
        href={links.wallet}
        target="_blank"
        className={cn("flex items-center gap-2")}
      >
        <SquareArrowOutUpRight size={17} />
        Wallet Actions
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem className={cn("cursor-pointer")} onClick={handleLogout}>
      <span className={cn("flex items-center gap-2")}>
        <LogOut size={17} />
        Log out
      </span>
    </DropdownMenuItem>
  </>
);
