"use client";

import { IntroSection } from "./intro";
import { useCommune } from "@commune-ts/providers/use-commune";
import { useEffect, useState } from "react";
import { WalletSections } from "./wallet-sections";
import React from "react";

export function Wallet() {
  const {
    // Connections
    // Transactions
    // Wallet
    addStake,
    balance,
    handleGetWallets,
    removeStake,
    selectedAccount,
    stakeOut,
    transfer,
    transferStake,
  } = useCommune();

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

  const handleSwitchWallet = () => {
    handleGetWallets();
    setShowWallets(true);
  };

  return (
    <main className="flex min-h-[86dvh] flex-col items-center justify-center gap-3 text-white">
      {selectedAccount && !showWallets ? (
        <>
          <p className="text-gray-400 animate-fade animate-delay-700">
            MAIN NET
          </p>
          <WalletSections.Root>
            <WalletSections.Header
              onSwitchWallet={handleSwitchWallet}
              selectedAccount={selectedAccount}
            />
            <WalletSections.Balance
              balance={balance}
              selectedAccount={selectedAccount}
            />
            <WalletSections.Actions
              addStake={addStake}
              balance={balance}
              removeStake={removeStake}
              selectedAccount={selectedAccount}
              transfer={transfer}
              transferStake={transferStake}
              userStakeWeight={userStakeWeight}
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
