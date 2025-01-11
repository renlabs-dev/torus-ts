"use client";

import React, { useCallback } from "react";

import { erc20Abi } from "viem";
import * as wagmi from "wagmi";
// TODO: TORUS TESTNET AND TORUS EVM  BASE SEPOLIA DOESN'T REFETCH

import Image from "next/image";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";

const TORUS_NETWORK_NAME: string = {
  mainnet: "Torus",
  testnet: "Torus Testnet",
}[env.NEXT_PUBLIC_CHAIN_ENV];

export function WalletBalance() {
  const getChainValues = getChainValuesOnEnv(env.NEXT_PUBLIC_CHAIN_ENV);

  const { chainId: torusEvmChainId } = getChainValues("torus");
  const { chainId: baseChainId } = getChainValues("base");

  // Torus
  const { api, isAccountConnected, isInitialized, selectedAccount } =
    useTorus();

  // EVM
  const { address: evmAddress } = wagmi.useAccount();

  // -- Torus EVM --

  const torusEvmClient = wagmi.useClient({ chainId: torusEvmChainId });
  if (torusEvmClient == null) throw new Error("Torus EVM client not found");

  const { chain: torusEvmChain } = torusEvmClient;

  const { data: torusEvmBalance, refetch: refetchTorusEvmBalance } =
    wagmi.useBalance({
      address: evmAddress,
      chainId: torusEvmChain.id,
    });

  console.log(refetchTorusEvmBalance);

  // -- Base --

  const baseClient = wagmi.useClient({ chainId: baseChainId });
  if (baseClient == null) throw new Error("Base client not found");

  const { chain: baseChain } = baseClient;

  const { data: baseBalanceQuery, refetch: refetchBaseBalanceQuery } =
    wagmi.useReadContract({
      chainId: baseChain.id,
      address: "0x0Aa8515D2d85a345C01f79506cF5941C65DdABb9",
      abi: erc20Abi,
      functionName: "balanceOf",
      args: evmAddress ? [evmAddress] : undefined,
    });

  console.log(refetchBaseBalanceQuery);

  // -- Torus --

  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );
  if (accountFreeBalance.isError) {
    console.error(accountFreeBalance.error);
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
      amount: torusEvmBalance?.value ?? 0n,
      label: `${torusEvmChain.name} EVM`,
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
      amount: baseBalanceQuery ?? 0,
      // amount: baseBalance,
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
    <div className="min-fit flex flex-col gap-4 xs:flex-row lg:flex-col">
      {balancesList.map((item) => (
        <Card
          key={item.label}
          className="flex w-full flex-col gap-2 border-muted bg-background px-7 py-5"
        >
          {item.amount == null && <Skeleton className="flex w-1/2 py-3" />}

          {item.amount != null && (
            <p className="flex items-end gap-1 text-muted-foreground">
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
