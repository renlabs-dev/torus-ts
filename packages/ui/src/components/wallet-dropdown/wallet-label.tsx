"use client";

import {
  smallAddress,
  smallWalletName,
} from "@torus-network/torus-utils/subspace";
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
    return `${smallWalletName(meta.name, 12)} | ${smallAddress(address, 3)}`;
  }

  return smallAddress(address, 6);
};
