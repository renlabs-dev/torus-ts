"use client";

import React, { useEffect, useState } from "react";

import type { InjectedAccountWithMeta } from "@torus-ts/ui";
import { useTorus } from "@torus-ts/providers/use-torus";
import { formatToken } from "@torus-ts/subspace/utils";

interface WalletBalanceProps {
  balance: bigint | undefined;
  selectedAccount: InjectedAccountWithMeta;
}

export function WalletBalance(props: WalletBalanceProps) {
  const { userTotalStaked } = useTorus();
  const [freeBalancePercentage, setFreeBalancePercentage] = useState(0);
  const [totalStakedBalance, setTotalStakedBalance] = useState<bigint>(0n);

  useEffect(() => {
    // Calculate the total staked balance from userTotalStaked
    if (userTotalStaked && userTotalStaked.length > 0) {
      const totalStaked = userTotalStaked.reduce((acc, item) => {
        return acc + BigInt(item.stake);
      }, 0n);
      setTotalStakedBalance(totalStaked);
    } else {
      setTotalStakedBalance(0n);
    }
  }, [userTotalStaked]);

  useEffect(() => {
    const freeBalance = Number(props.balance ?? 0);
    const stakedBalance = Number(totalStakedBalance);
    const availablePercentage =
      (freeBalance * 100) / (stakedBalance + freeBalance);

    if (isNaN(availablePercentage) || !availablePercentage) {
      setFreeBalancePercentage(0);
      return;
    }
    setFreeBalancePercentage(availablePercentage);
  }, [props.balance, totalStakedBalance]);

  return (
    <div className="flex w-full animate-fade-up flex-col gap-4 border-white/20 py-4 text-white animate-delay-200">
      <div className="border border-white/20 p-4">
        <div className="flex w-full justify-between gap-6">
          <div>
            {props.balance === undefined ? (
              <p className="animate-pulse text-xl text-green-700">
                ---
                <span className="ml-1 text-sm font-light text-gray-400">
                  COMAI
                </span>
              </p>
            ) : (
              <p className="text-xl text-green-500">
                {formatToken(props.balance)}
                <span className="ml-1 text-sm font-light text-gray-400">
                  COMAI
                </span>
              </p>
            )}

            <p className="text-xs text-gray-500">Free Balance</p>
          </div>
          <div className="text-right">
            <p className="text-xl text-red-500">
              {totalStakedBalance ? formatToken(totalStakedBalance) : "---"}
              <span className="ml-1 text-sm font-light text-gray-400">
                COMAI
              </span>
            </p>
            <p className="text-xs text-gray-500">Staked Balance</p>
          </div>
        </div>
        {totalStakedBalance ? (
          <div className="relative flex h-2 w-full pt-1">
            <span
              className="absolute h-2 bg-green-500"
              style={{
                width: `${freeBalancePercentage.toFixed(2)}%`,
              }}
            />
            <span className="h-2 w-full bg-red-500" />
          </div>
        ) : (
          <div className="relative flex h-2 w-full animate-pulse pt-1">
            <span
              className="absolute h-2 bg-green-500/20"
              style={{
                width: `50%`,
              }}
            />
            <span className="h-2 w-full bg-red-500/20" />
          </div>
        )}
      </div>
    </div>
  );
}
