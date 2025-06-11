"use client";

import {
  smallAddress,
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
    return (
      <span className="inline-flex items-center">
        <span className="max-w-[3rem] truncate sm:max-w-[5rem] md:max-w-[8rem] lg:max-w-[10rem]">
          {meta.name}
        </span>
        <span className="hidden sm:inline md:hidden">
          {" "}
          | {smallAddress(address, 3)}
        </span>
        <span className="hidden md:inline lg:hidden">
          {" "}
          | {smallAddress(address, 5)}
        </span>
        <span className="hidden lg:inline"> | {smallAddress(address, 10)}</span>
        <span className="sm:hidden"> | {smallAddress(address, 2)}</span>
      </span>
    );
  }
  return smallAddress(address, 6);
};
