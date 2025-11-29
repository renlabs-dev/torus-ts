"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Card } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { cn } from "@torus-ts/ui/lib/utils";
import { contractAddresses, getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import Image from "next/image";
import React, { useCallback } from "react";
import { erc20Abi } from "viem";
import * as wagmi from "wagmi";

const BalanceIcon = ({ src, alt }: { src: string; alt: string }) => (
  <Image src={src} alt={alt} width={24} height={24} className="flex-shrink-0" />
);

export function WalletBalance() {
  const getChainValues = getChainValuesOnEnv(
    env("NEXT_PUBLIC_TORUS_CHAIN_ENV"),
  );

  const { chainId: torusEvmChainId } = getChainValues("torus");
  const { chainId: baseChainId } = getChainValues("base");

  const { api, isAccountConnected, isInitialized, selectedAccount } =
    useTorus();
  const { address: evmAddress } = wagmi.useAccount();
  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const torusEvmClient = wagmi.useClient({ chainId: torusEvmChainId });
  const baseClient = wagmi.useClient({ chainId: baseChainId });

  const torusEvmChain = torusEvmClient?.chain;
  const baseChain = baseClient?.chain;

  const { data: torusEvmBalance } = wagmi.useBalance({
    address: evmAddress,
    chainId: torusEvmChain?.id,
  });

  const baseTorusAddress =
    contractAddresses.base[env("NEXT_PUBLIC_TORUS_CHAIN_ENV")].torusErc20;

  const { data: baseBalance } = wagmi.useReadContract({
    chainId: baseChain?.id,
    address: baseTorusAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
  });

  const userAccountFreeBalance = useCallback(() => {
    if (
      !isInitialized ||
      !isAccountConnected ||
      accountFreeBalance.isRefetching
    )
      return null;

    if (accountFreeBalance.data != null) {
      return accountFreeBalance.data;
    }

    return 0n;
  }, [accountFreeBalance, isAccountConnected, isInitialized]);

  if (!torusEvmClient) {
    console.error("Torus EVM client not found for chainId:", torusEvmChainId);
    return (
      <div className="text-red-600">Error: Torus EVM client unavailable</div>
    );
  }

  if (!baseClient) {
    console.error("Base client not found for chainId:", baseChainId);
    return <div className="text-red-600">Error: Base client unavailable</div>;
  }

  if (accountFreeBalance.isError) {
    console.error("Error fetching free balance:", accountFreeBalance.error);
  }

  // 1 TORUS = 1e18 wei
  const ONE_TORUS = 1_000_000_000_000_000_000n;

  // Hide EVM balance if <= 1 TORUS
  const shouldShowEvmBalance =
    torusEvmBalance?.value != null && torusEvmBalance.value > ONE_TORUS;

  const balancesList = [
    {
      amount: userAccountFreeBalance(),
      asset: "TORUS",
      label: "Torus Balance",
      iconSrc: "/assets/icons/balance/torus-native.svg",
      iconAlt: "Torus Native",
      address: selectedAccount?.address,
      isSecondary: false,
    },
    {
      amount: baseBalance ?? null,
      asset: "BASE",
      label: "Base Balance",
      iconSrc: "/assets/icons/balance/torus-base.svg",
      iconAlt: "Base",
      address: evmAddress,
      isSecondary: false,
    },
    ...(shouldShowEvmBalance
      ? [
          {
            amount: torusEvmBalance.value,
            asset: "EVM",
            label: "Torus EVM Balance",
            iconSrc: "/assets/icons/balance/torus-evm.svg",
            iconAlt: "Torus EVM",
            address: evmAddress,
            isSecondary: true,
          },
        ]
      : []),
  ];

  return (
    <Card className="flex h-[253px] max-h-[253px] min-h-[253px] w-full flex-col gap-6 p-4">
      {balancesList.map((item) => (
        <div
          key={item.label}
          className={cn(
            "flex flex-col gap-1",
            item.isSecondary && "opacity-60",
          )}
        >
          {item.amount == null ? (
            <Skeleton
              className={cn(item.isSecondary ? "h-4 w-20" : "h-5 w-24")}
            />
          ) : (
            <div
              className={cn(
                "-my-0.5 font-semibold leading-5 text-white",
                item.isSecondary ? "text-xs" : "text-sm",
              )}
            >
              {formatToken(item.amount)} {item.asset}
            </div>
          )}

          <div className="flex items-center gap-2">
            <BalanceIcon src={item.iconSrc} alt={item.iconAlt} />
            <span
              className={cn(
                "leading-5 text-zinc-400",
                item.isSecondary ? "text-[10px]" : "text-xs",
              )}
            >
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}
