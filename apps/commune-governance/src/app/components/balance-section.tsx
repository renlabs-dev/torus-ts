"use client";

import Image from "next/image";

import { useBalance } from "@commune-ts/providers/hooks";
import { useCommune } from "@commune-ts/providers/use-commune";
import { Card, Label, Separator } from "@commune-ts/ui";
import { formatToken } from "@commune-ts/utils";

export function BalanceSection({
  className,
}: {
  className?: string;
}): JSX.Element {
  const {
    isInitialized,
    handleWalletModal,
    daoTreasury,
    balance,
    selectedAccount,
    stakeOut,
    api,
  } = useCommune();

  const { data: daosTreasuries } = useBalance(api, daoTreasury);

  let userStakeWeight: bigint | null = null;
  if (stakeOut != null && selectedAccount != null) {
    const userStakeEntry = stakeOut.perAddr[selectedAccount.address];
    userStakeWeight = userStakeEntry ?? 0n;
  }

  const balanceLoaded = typeof balance !== "undefined";

  return (
    <div
      className={`flex w-full flex-col items-center justify-center lg:mt-10 ${className ?? ""}`}
    >
      <div
        className={`flex w-full flex-col text-2xl text-green-500 lg:flex-row lg:gap-6 lg:pb-5`}
      >
        <Card className="flex animate-fade-down flex-row items-center justify-between p-6 lg:w-1/3">
          <div className="flex flex-col gap-1">
            {!daoTreasury && !isInitialized ? (
              <p className="animate-pulse text-gray-400">
                Loading...
                <span className="text-lg text-white"> COMAI</span>
              </p>
            ) : (
              <p>
                {formatToken(daosTreasuries ?? 0n)}
                <span className="text-lg text-white"> COMAI</span>
              </p>
            )}
            <Label className="text-gray-300">DAO treasury funds</Label>
          </div>
          <Image alt="Dao Icon" height={40} src="/dao-icon.svg" width={40} />
        </Card>

        <Card className="flex animate-fade-down flex-row items-center justify-between p-6 animate-delay-100 lg:w-1/3">
          <div className="flex flex-col items-start gap-1">
            {!isInitialized && (
              <p className="animate-pulse text-gray-400">
                Loading...
                <span className="text-lg text-white"> COMAI</span>
              </p>
            )}

            {isInitialized && !balanceLoaded && selectedAccount?.meta.name && (
              <p className="animate-pulse text-gray-400">
                Loading...
                <span className="text-lg text-white"> COMAI</span>
              </p>
            )}

            {isInitialized && !selectedAccount?.meta.name && (
              <button
                className="inline-flex items-center justify-center text-gray-300 hover:text-green-600"
                disabled={!isInitialized}
                onClick={() => handleWalletModal()}
                type="button"
              >
                Connect wallet
              </button>
            )}

            {isInitialized && selectedAccount?.meta.name && balanceLoaded && (
              <p>
                {formatToken(balance)}
                <span className="text-lg text-white"> COMAI</span>
              </p>
            )}

            <Label className="text-gray-300">Your total free balance</Label>
          </div>
          <Image
            alt="Wallet Icon"
            height={40}
            src="/wallet-icon.svg"
            width={40}
          />
        </Card>

        <Card className="flex animate-fade-down flex-row items-center justify-between p-6 animate-delay-200 lg:w-1/3">
          <div className="flex flex-col items-start gap-1">
            {!isInitialized ||
              (selectedAccount?.meta.name && userStakeWeight == null) ? (
              <p className="animate-pulse text-gray-400">
                Loading...
                <span className="text-lg text-white"> COMAI</span>
              </p>
            ) : !selectedAccount?.meta.name || userStakeWeight == null ? (
              <button
                className="inline-flex items-center justify-center text-gray-300 hover:text-green-600"
                disabled={!isInitialized}
                onClick={() => handleWalletModal()}
                type="button"
              >
                Connect wallet
              </button>
            ) : (
              <p>
                {formatToken(userStakeWeight)}{" "}
                <span className="text-lg text-white"> COMAI</span>
              </p>
            )}
            <Label className="text-gray-300">Your total Staked balance</Label>
          </div>
          <Image
            alt="Globe Icon"
            height={40}
            src="/globe-icon.svg"
            width={40}
          />
        </Card>
      </div>
      <Separator className="animate-fade animate-delay-700" />
    </div>
  );
}
