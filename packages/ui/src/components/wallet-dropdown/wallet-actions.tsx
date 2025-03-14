"use client";

import { LogOut, SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { DropdownMenuItem, DropdownMenuSeparator } from "../dropdown-menu";

import { cn } from "../../lib/utils";
import { getLinks } from "@torus-ts/ui/lib/data";

interface WalletActionsProps {
  handleLogout: () => void;
  torusChainEnv: string;
}

export const WalletActions = ({
  handleLogout,
  torusChainEnv,
}: WalletActionsProps) => {
  const links = getLinks(torusChainEnv);

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuItem className={cn("cursor-pointer")}>
        <Link
          href={links.wallet}
          target="_blank"
          className={cn("flex items-center gap-2")}
        >
          <SquareArrowOutUpRight size={17} />
          Wallet
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
};
