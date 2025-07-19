"use client";

import {
  smallAddress,
  smallWalletName,
} from "@torus-network/torus-utils/torus/address";

import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";

import type { InjectedAccountWithMeta } from "./wallet-dropdown";

interface WalletLabelProps {
  isInitialized: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  shouldDisplayText?: boolean;
}

export const WalletLabel = ({
  isInitialized,
  selectedAccount,
  shouldDisplayText,
}: WalletLabelProps) => {
  const isMobile = useIsMobile();

  if (!isInitialized) {
    return "Loading...";
  }

  if (!selectedAccount?.address) {
    return `Connect ${shouldDisplayText ? "Torus " : ""}Wallet`;
  }

  const { address, meta } = selectedAccount;

  if (shouldDisplayText) {
    return `Torus (${smallAddress(address, 6)})`;
  }

  if (meta.name && meta.name.length > 8) {
    return `${smallWalletName(meta.name, 7)} | ${smallAddress(address, 3)}`;
  }

  if (meta.name) {
    return (
      <span className="inline-flex items-center gap-2">
        <span className="max-w-[3rem] truncate sm:max-w-[5rem] md:max-w-[8rem] lg:max-w-[10rem]">
          {meta.name}
        </span>
        <span>|</span>
        <span>{smallAddress(address, isMobile ? 3 : 6)}</span>
      </span>
    );
  }
  return smallAddress(address, 6);
};
