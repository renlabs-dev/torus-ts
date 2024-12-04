"use client";

import React, { useEffect, useState } from "react";

import { useTorus } from "@torus-ts/providers/use-torus";

import { IntroSection } from "./intro";
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

  const [showWallets, setShowWallets] = useState(false);
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
    <main className="flex min-h-[86dvh] flex-col items-center justify-center gap-3 text-white">
      {selectedAccount && !showWallets ? (
        <>
          <p className="animate-fade text-gray-400 animate-delay-700">
            MAIN NET
          </p>
          <WalletSections.Root>
            <WalletSections.Actions
              addStake={addStake}
              balance={balance}
              removeStake={removeStake}
              selectedAccount={selectedAccount}
              transfer={transfer}
              transferStake={transferStake}
              userStakeWeight={userStakeWeight}
            />
            <WalletSections.Balance
              balance={balance}
              selectedAccount={selectedAccount}
            />
          </WalletSections.Root>
        </>
      ) : (
        <IntroSection
          onWalletSwitch={refreshUserStakeWeight}
          setShowWallets={setShowWallets}
          showWallets={showWallets}
        />
      )}
    </main>
  );
}
