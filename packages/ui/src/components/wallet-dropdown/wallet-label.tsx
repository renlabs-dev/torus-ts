"use client";

import { smallAddress, smallWalletName } from "@torus-ts/utils/subspace";
import { InjectedAccountWithMeta } from "./wallet-dropdown";

interface WalletLabelProps {
  selectedAccount: InjectedAccountWithMeta | null;
  shouldDisplayText?: boolean;
}

export const WalletLabel = ({
  selectedAccount,
  shouldDisplayText,
}: WalletLabelProps) => {
  if (!selectedAccount?.address) {
    return `Connect ${shouldDisplayText ? "Torus " : ""}Wallet`;
  }

  const { address, meta } = selectedAccount;

  if (shouldDisplayText) {
    return `Torus (${smallAddress(address, 6)})`;
  }

  if (meta?.name) {
    return `${smallWalletName(meta.name, 15)} | ${smallAddress(address, 3)}`;
  }

  return smallAddress(address, 6);
};
