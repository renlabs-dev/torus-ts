"use client";

import dynamic from "next/dynamic";
import { TransferDetails } from "./_components/transfer-details";

// Critical components - loaded immediately
const SelectActionDialog = dynamic(
  () =>
    import("./_components/select-action-dialog").then((mod) => ({
      default: mod.SelectActionDialog,
    })),
  {
    loading: () => (
      <div className="h-32 animate-pulse rounded-lg bg-gray-800" />
    ),
  },
);

// Non-critical components - lazy loaded
const GuideDialog = dynamic(
  () =>
    import("./_components/guide-dialog").then((mod) => ({
      default: mod.GuideDialog,
    })),
  {
    loading: () => (
      <div className="h-48 animate-pulse rounded-lg bg-gray-800" />
    ),
    // Don't load until needed
  },
);

// Heavy wallet components - only load when wallet is selected
const WalletActions = dynamic(
  () =>
    import("./_components/shared/wallet-actions").then((mod) => ({
      default: mod.default,
    })),
  {
    loading: () => (
      <div className="h-40 animate-pulse rounded-lg bg-gray-800" />
    ),
    // Don't load until user interacts with wallet
  },
);

const WalletBalance = dynamic(
  () =>
    import("./_components/shared/wallet-balance").then((mod) => ({
      default: mod.WalletBalance,
    })),
  {
    loading: () => (
      <div className="h-20 animate-pulse rounded-lg bg-gray-800" />
    ),
    // Don't load until user interacts with wallet
  },
);

const SidebarLinks = dynamic(
  () =>
    import("./_components/shared/sidebar-links").then((mod) => ({
      default: mod.SidebarLinks,
    })),
  {
    loading: () => (
      <div className="h-24 animate-pulse rounded-lg bg-gray-800" />
    ),
    // Load after main content
  },
);

export default function HomePageOptimized() {
  return (
    <main className="mx-auto flex min-w-full flex-col items-start gap-3 text-white lg:mt-[calc(20vh-64px)]">
      {/* Critical component - loads immediately */}
      <TransferDetails />

      {/* Main dialogs - load quickly */}
      <div className="mb-4 mt-12 flex w-full flex-col gap-6 md:mt-0 md:flex-row">
        <SelectActionDialog />
        <GuideDialog />
      </div>

      {/* Sidebar and actions - lazy loaded */}
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
