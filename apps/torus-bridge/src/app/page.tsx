"use client";

import { SelectActionDialog } from "./_components/select-action-dialog";
import { IntroSection } from "./_components/shared/intro";
import { SidebarLinks } from "./_components/shared/sidebar-links";
import WalletActions from "./_components/shared/wallet-actions";
import { WalletBalance } from "./_components/shared/wallet-balance";
import { TransferDetails } from "./_components/transfer-details";

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto flex min-w-full flex-col items-start gap-3 text-white">
      <IntroSection />
      <TransferDetails />
      <SelectActionDialog />

      <div className="flex w-full flex-col justify-around gap-6 lg:flex-row">
        <div className="flex w-full animate-fade flex-col gap-4 lg:w-4/12">
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
