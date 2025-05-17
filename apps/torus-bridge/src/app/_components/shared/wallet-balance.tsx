"use client";

import type { SS58Address } from "@torus-network/sdk";
import { formatToken } from "@torus-network/torus-utils/subspace";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Card } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import Image from "next/image";
import React, { useCallback } from "react";
import { erc20Abi } from "viem";
import * as wagmi from "wagmi";

const TORUS_NETWORK_NAME: string = {
  mainnet: "Torus",
  testnet: "Torus Testnet",
}[env("NEXT_PUBLIC_TORUS_CHAIN_ENV")];

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

  if (accountFreeBalance.isError) {
    console.error("Error fetching free balance:", accountFreeBalance.error);
  }
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

  const torusEvmClient = wagmi.useClient({ chainId: torusEvmChainId });

  const baseClient = wagmi.useClient({ chainId: baseChainId });

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

  const { chain: torusEvmChain } = torusEvmClient;
  const { chain: baseChain } = baseClient;

  const { data: torusEvmBalance } = wagmi.useBalance({
    address: evmAddress,
    chainId: torusEvmChain.id,
  });

  const { data: baseBalance } = wagmi.useReadContract({
    chainId: baseChain.id,
    address: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867",
    abi: erc20Abi,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
  });

  const balancesList = [
    {
      amount: userAccountFreeBalance(),
      label: TORUS_NETWORK_NAME,
      icon: (
        <Image
          width={16}
          height={16}
          alt="Torus Balance"
          src="/torus-balance-icon.svg"
        />
      ),
      address: selectedAccount?.address,
    },
    {
      amount: torusEvmBalance?.value ?? null,
      label: torusEvmChain.name,
      icon: (
        <Image
          width={16}
          height={16}
          alt="Torus EVM Balance"
          src="/torus-evm-balance-icon.svg"
        />
      ),
      address: evmAddress,
    },
    {
      amount: baseBalance ?? null,
      label: `${baseChain.name}`,
      icon: (
        <Image
          width={16}
          height={16}
          alt="Base Balance"
          src="/torus-base-balance-icon.svg"
        />
      ),
      address: evmAddress,
    },
  ];

  return (
    <div className="min-fit xs:flex-row flex flex-col gap-4 lg:flex-col">
      {balancesList.map((item) => (
        <Card key={item.label} className="flex w-full flex-col gap-2 px-7 py-5">
          {item.amount == null && <Skeleton className="flex w-1/2 py-3" />}

          {item.amount != null && (
            <p className="text-muted-foreground flex items-end gap-1">
              {formatToken(item.amount)}
              <span className="text-sm">TORUS</span>
            </p>
          )}

          <span className="flex items-center gap-2 text-base">
            {item.icon} {item.label}
          </span>
        </Card>
      ))}
    </div>
  );
}
