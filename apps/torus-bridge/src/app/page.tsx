"use client";

import { InfoIcon } from "lucide-react";

import { GuideDialog } from "./_components/guide-dialog";
import { SelectActionDialog } from "./_components/select-action-dialog";
import { SidebarLinks } from "./_components/shared/sidebar-links";
import WalletActions from "./_components/shared/wallet-actions";
import { WalletBalance } from "./_components/shared/wallet-balance";
import { TransferDetails } from "./_components/transfer-details";

export default function HomePage() {
  return (
    <main
      className="mx-auto flex min-w-full flex-col items-start gap-3 text-white
        lg:mt-[calc(20vh-64px)]"
    >
      <div className="absolute top-24 sm:flex items-center justify-center w-full left-0 right-0 hidden">
        <div
          className="w-fit animate-fade rounded-lg mb-2 border border-red-500/20 bg-red-500/10 p-4
            text-center"
        >
          <p className="text-sm text-red-400">
            <InfoIcon className="inline mr-2 h-4 w-4 mb-0.5" />
            We're currently investigating an issue with bridging to Torus EVM.
            Sorry for the inconvenience.
          </p>
        </div>
      </div>
      <TransferDetails />
      <div className="mb-4 mt-12 flex w-full flex-col gap-6 md:mt-0 md:flex-row">
        <SelectActionDialog />
        <GuideDialog />
      </div>
      <div className="flex w-full flex-col justify-around gap-6 lg:flex-row">
        <div className="animate-fade flex w-full flex-col gap-4 lg:w-4/12">
          <SidebarLinks />
          <WalletBalance />
        </div>
        <div className="flex w-full flex-col gap-6">
          <WalletActions />
        </div>
      </div>
    </main>
  );
}
