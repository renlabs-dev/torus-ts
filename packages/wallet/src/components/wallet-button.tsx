"use client";

import "../output.css";

import Image from "next/image";

import { useTorus } from "@torus-ts/providers/use-torus";
import { smallAddress } from "@torus-ts/utils";

interface TWalletButtonProps {
  customHandler?: () => void;
  className?: string;
}

export function WalletButton(props: TWalletButtonProps) {
  const { customHandler, className } = props;
  const {
    selectedAccount,
    // eslint-disable-next-line @typescript-eslint/unbound-method
    handleWalletModal,
    accounts,
    isInitialized,
    handleConnect,
  } = useTorus();

  if (!isInitialized) {
    return (
      <div className="tw-relative tw-inline-flex tw-items-center tw-justify-center tw-gap-3 tw-text-nowrap tw-border tw-border-white/20 tw-bg-[#898989]/5 tw-px-4 tw-py-2 tw-text-gray-400 tw-backdrop-blur-md">
        <Image
          alt="Wallet Icon"
          className="tw-h-6 tw-w-6"
          src="/wallet-icon.svg"
          width={40}
          height={40}
        />
        <span>Loading Wallet Info...</span>
      </div>
    );
  }

  const handleConnectWallet = async () => {
    await handleConnect();
    handleWalletModal();
  };

  return (
    <button
      className={`tw-relative tw-w-auto tw-z-50 tw-flex tw-items-center tw-justify-center tw-gap-3 tw-border tw-border-white/20 tw-px-4 tw-py-2 tw-text-gray-400 tw-transition tw-duration-200 tw-backdrop-blur-md hover:tw-border-green-500 hover:tw-bg-green-500/10 hover:tw-text-green-500 ${selectedAccount && "tw-border-green-500 tw-text-green-500"} ${className}`}
      onClick={customHandler ? customHandler : handleConnectWallet}
      disabled={!accounts}
      type="button"
    >
      <Image
        alt="Wallet Icon"
        className="tw-w-6"
        height={40}
        width={40}
        src="/wallet-icon.svg"
      />

      {selectedAccount?.meta.name ? (
        <div className="tw-flex tw-flex-col tw-items-start">
          <span className="tw-text-nowrap">
            {smallAddress(selectedAccount.address)}
          </span>
        </div>
      ) : (
        <span className="tw-text-white">Connect Wallet</span>
      )}
    </button>
  );
}
