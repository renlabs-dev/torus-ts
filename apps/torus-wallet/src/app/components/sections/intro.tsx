"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { ChevronsLeft } from "lucide-react";

import type { InjectedAccountWithMeta } from "@torus-ts/ui/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Loading, NoWalletExtensionDisplay } from "@torus-ts/ui";

import { oxanium } from "~/utils/fonts";
import { WalletSections } from "./wallet-sections";

interface IntroSectionProps {
  onWalletSwitch: () => void;
  setShowWallets: (show: boolean) => void;
  showWallets: boolean;
}

export function IntroSection(props: IntroSectionProps) {
  const {
    accounts,
    // handleConnect,
    isInitialized,
    selectedAccount,
    setIsConnected,
    setSelectedAccount,
  } = useTorus();

  const handleConnectWallet = () => {
    // await handleConnect();
    props.setShowWallets(true);
  };

  const handleBack = () => {
    props.setShowWallets(false);
  };

  const handleSelectWallet = (account: InjectedAccountWithMeta) => {
    const currentWallet = localStorage.getItem("favoriteWalletAddress");
    if (account.address === currentWallet) return;

    setSelectedAccount(account);
    localStorage.removeItem("authorization");
    localStorage.setItem("favoriteWalletAddress", account.address);
    setIsConnected(true);
    props.setShowWallets(false);
    props.onWalletSwitch();
  };

  useEffect(() => {
    if (selectedAccount) {
      props.onWalletSwitch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, props.onWalletSwitch]);
  return (
    <>
      {props.showWallets ? (
        <WalletSections.Root>
          <div className="flex w-full animate-fade-up items-center justify-between pb-4">
            <button
              onClick={handleBack}
              className="text-green-500 hover:text-green-400"
            >
              <span className="flex items-center">
                <ChevronsLeft className="h-6 w-6" />{" "}
                <p className="text-lg">BACK</p>
              </span>
            </button>
            <h2 className={`${oxanium.className} text-xl`}>Select Wallet</h2>
          </div>
          <div className="flex w-full animate-fade-up flex-col gap-2 pt-6 animate-delay-300">
            {accounts && accounts.length > 0 ? (
              accounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectWallet(account)}
                  className={`w-full p-4 text-left transition duration-200 ${
                    selectedAccount?.address === account.address
                      ? "border border-green-500 bg-green-500/20 text-green-500 hover:bg-green-500/30"
                      : "border border-white/20 text-white hover:bg-white/10"
                  }`}
                >
                  <p className="font-semibold">
                    {account.meta.name?.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-300">{account.address}</p>
                </button>
              ))
            ) : (
              <NoWalletExtensionDisplay />
            )}
          </div>
        </WalletSections.Root>
      ) : (
        <WalletSections.Root>
          <div className="col-span-1 flex items-center pb-6">
            <Image
              src="/logo-green.svg"
              width={45}
              height={45}
              alt="torus logo"
              priority
              className="mr-[3px] animate-fade-up animate-delay-200"
            />
            <h2
              className={`${oxanium.className} ml-2 animate-fade-up text-2xl animate-delay-200`}
            >
              torus AI Wallet
            </h2>
          </div>
          <p className="w-full animate-fade-up py-6 text-center text-lg text-gray-300 animate-delay-300">
            Enjoy full control over your assets with our non-custodial wallet,
            designed for user <span className="text-green-500">autonomy</span>{" "}
            and <span className="text-green-500">security</span>.
          </p>
          <div className="flex w-full animate-fade-up space-x-4 pt-6 animate-delay-500">
            <button
              disabled={!isInitialized}
              onClick={handleConnectWallet}
              className="w-full border border-green-500 bg-green-600/5 py-2.5 text-lg font-semibold text-green-500 transition duration-200 hover:border-green-400 hover:bg-green-500/15 hover:text-green-400"
            >
              {isInitialized ? "Connect Wallet" : <Loading />}
            </button>
          </div>
        </WalletSections.Root>
      )}
    </>
  );
}
