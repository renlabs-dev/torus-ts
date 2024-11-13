"use client";

import React from "react";
import { ChevronsLeft } from "lucide-react";

import type { InjectedAccountWithMeta } from "@torus-ts/ui";
import { toast } from "@torus-ts/providers/use-toast";
import { copyToClipboard } from "@torus-ts/ui/utils";
import { smallAddress } from "@torus-ts/utils/subspace";

import { ImageIcon } from "../image-icon";

interface WalletHeaderProps {
  onSwitchWallet: () => void;
  selectedAccount: InjectedAccountWithMeta;
}

export function WalletHeader(props: WalletHeaderProps) {
  function handleCopy() {
    copyToClipboard(props.selectedAccount.address);
    toast.success("Address copied to clipboard");
  }

  return (
    <div className="flex w-full animate-fade-up flex-col items-center justify-center text-lg text-gray-300 animate-delay-100">
      <div className="flex w-full flex-col gap-4 pb-4 md:flex-row">
        <button
          onClick={handleCopy}
          className="flex w-full items-center justify-center gap-2 text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50"
        >
          <ImageIcon src="wallet-icon.svg" className="h-6 w-6" />
          <span className="flex gap-1">
            <p className="text-green-500">
              {props.selectedAccount.meta.name?.toUpperCase()}
            </p>
            <p className="hidden md:block">
              /{" "}
              {props.selectedAccount.meta.name &&
              props.selectedAccount.meta.name.length > 10
                ? smallAddress(props.selectedAccount.address)
                : props.selectedAccount.address}
            </p>
            <p className="block md:hidden">
              {smallAddress(props.selectedAccount.address)}
            </p>
          </span>
        </button>
        <button
          onClick={props.onSwitchWallet}
          className="flex w-full items-center justify-center text-nowrap border border-green-500 bg-green-600/5 px-6 py-2.5 font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 active:bg-green-500/50 md:w-fit"
        >
          <ChevronsLeft className="h-6 w-6" /> Switch Wallet
        </button>
      </div>
    </div>
  );
}
