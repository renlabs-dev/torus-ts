"use client";

import { formatToken } from "@commune-ts/subspace/utils";
import React, { useEffect, useState } from "react";
import type { InjectedAccountWithMeta } from "@commune-ts/ui";
import { useCommune } from "@commune-ts/providers/use-commune";

interface WalletBalanceProps {
  balance: bigint | undefined;
  selectedAccount: InjectedAccountWithMeta;
}

export function WalletBalance(props: WalletBalanceProps) {
  const { userTotalStaked } = useCommune();
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
    <div className="flex flex-col w-full gap-4 py-4 text-white animate-fade-up border-white/20 animate-delay-200">
      <div className="p-4 border border-white/20">
        <div className="flex justify-between w-full gap-6">
          <div>
            {props.balance === undefined ? (
              <p className="text-xl text-green-700 animate-pulse">
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
              {totalStakedBalance
                ? formatToken(totalStakedBalance)
                : "---"}
              <span className="ml-1 text-sm font-light text-gray-400">
                COMAI
              </span>
            </p>
            <p className="text-xs text-gray-500">Staked Balance</p>
          </div>
        </div>
        {totalStakedBalance ? (
          <div className="relative flex w-full h-2 pt-1">
            <span
              className="absolute h-2 bg-green-500"
              style={{
                width: `${freeBalancePercentage.toFixed(2)}%`,
              }}
            />
            <span className="w-full h-2 bg-red-500" />
          </div>
        ) : (
          <div className="relative flex w-full h-2 pt-1 animate-pulse">
            <span
              className="absolute h-2 bg-green-500/20"
              style={{
                width: `50%`,
              }}
            />
            <span className="w-full h-2 bg-red-500/20" />
          </div>
        )}
      </div>
    </div>
  );
}
