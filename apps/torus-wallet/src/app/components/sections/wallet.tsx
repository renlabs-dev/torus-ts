"use client";

import React, { useEffect, useState } from "react";
import { CornerRightUp } from "lucide-react";

import { useTorus } from "@torus-ts/providers/use-torus";

import { SidebarLinks } from "../sidebar-links";
import { WalletSections } from "./wallet-sections";

export function Wallet() {
  const {
    // Connections
    // Transactions
    // Wallet
    addStake,
    balance,
    removeStake,
    selectedAccount,
    stakeOut,
    transfer,
    transferStake,
  } = useTorus();

  // const [showWallets, setShowWallets] = useState(false);
  const [userStakeWeight, setUserStakeWeight] = useState<bigint | null>(null);

  function calculateUserStakeWeight() {
    if (stakeOut != null && selectedAccount != null) {
      const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
      return userStakeEntry ?? 0n;
    }
    return null;
  }

  const refreshUserStakeWeight = () => {
    const newUserStakeWeight = calculateUserStakeWeight();
    setUserStakeWeight(newUserStakeWeight);
  };

  useEffect(() => {
    refreshUserStakeWeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAccount, stakeOut]);

  return (
    <main className="relative mx-auto flex h-screen min-w-full flex-col items-center gap-3 text-white">
      {/* {selectedAccount && !showWallets ? ( */}
      <>
        {selectedAccount == null && (
          <>
            <span className="absolute right-5 top-2.5 h-1.5 w-1.5 rounded-full bg-muted" />
            <span className="absolute right-5 top-2.5 h-1.5 w-1.5 animate-ping rounded-full bg-muted-foreground animate-duration-[1500ms]" />
            <div className="absolute inset-0 mx-auto hidden min-h-full w-full max-w-screen-xl items-start justify-end py-1 md:flex">
              <div className="mr-7 mt-12 flex animate-pulse items-center gap-3 animate-duration-[1500ms]">
                <span className="text-base">
                  Connect your wallet to get started
                </span>
                <CornerRightUp size={22} className="mb-3" />
              </div>
            </div>
          </>
        )}
        {selectedAccount != null && (
          <div className="mt-[20vh] flex w-full gap-6">
            <div className="flex w-1/5 flex-col gap-4">
              <SidebarLinks />
              <WalletSections.Balance />
            </div>
            <WalletSections.Actions
              addStake={addStake}
              balance={balance}
              removeStake={removeStake}
              selectedAccount={selectedAccount}
              transfer={transfer}
              transferStake={transferStake}
              userStakeWeight={userStakeWeight}
            />
          </div>
        )}
      </>
      {/* ) : (
        <IntroSection
          onWalletSwitch={refreshUserStakeWeight}
          setShowWallets={setShowWallets}
          showWallets={showWallets}
        />
      )} */}
    </main>
  );
}
