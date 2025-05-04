"use client";

import { GuideDialog } from "./_components/guide-dialog";
import { SelectActionDialog } from "./_components/select-action-dialog";
import { SidebarLinks } from "./_components/shared/sidebar-links";
import WalletActions from "./_components/shared/wallet-actions";
// import { WalletBalance } from "./_components/shared/wallet-balance";
import { TransferDetails } from "./_components/transfer-details";

export default function HomePage() {
  return (
    <main
      className="mx-auto flex min-w-full flex-col items-start gap-3 text-white
        lg:mt-[calc(20vh-64px)]"
    >
      <TransferDetails />
      <div className="mb-4 mt-12 flex w-full flex-col gap-6 md:mt-0 md:flex-row">
        <SelectActionDialog />
        <GuideDialog />
      </div>
      <div className="flex w-full flex-col justify-around gap-6 lg:flex-row">
        <div className="animate-fade flex w-full flex-col gap-4 lg:w-4/12">
          <SidebarLinks />
          {/* <WalletBalance /> */}
        </div>
        <div className="flex w-full flex-col gap-6">
          <WalletActions />
        </div>
      </div>
    </main>
  );
}
