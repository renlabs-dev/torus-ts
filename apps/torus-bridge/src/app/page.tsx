"use client";

import { IntroSection } from "./_components/shared/intro";
import { SidebarLinks } from "./_components/shared/sidebar-links";
import WalletActions from "./_components/shared/wallet-actions";
import { WalletBalance } from "./_components/shared/wallet-balance";
import { TransferDetails } from "./_components/transfer-details";

export default function HomePage(): JSX.Element {
  return (
    <main className="mx-auto flex min-w-full flex-col items-center gap-3 text-white">
      <IntroSection />
      <TransferDetails />
      <div className="flex w-full flex-col justify-around gap-6 py-10 lg:mt-[20vh] lg:flex-row">
        <div className="flex w-full animate-fade flex-col gap-4 lg:w-4/12">
          <SidebarLinks />
          <WalletBalance />
        </div>
        <WalletActions />
      </div>
    </main>
  );
}
