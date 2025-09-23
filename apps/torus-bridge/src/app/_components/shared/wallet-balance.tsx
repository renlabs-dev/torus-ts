"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Card } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { getChainValuesOnEnv } from "~/config";
import { env } from "~/env";
import React, { useCallback } from "react";
import { erc20Abi } from "viem";
import * as wagmi from "wagmi";

const TorusNativeSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="-0.101695"
      y="0.101695"
      width="11.7966"
      height="11.7966"
      rx="5.8983"
      transform="matrix(-1 0 0 1 11.7966 0)"
      fill="#A1A1AB"
    />
    <rect
      x="-0.101695"
      y="0.101695"
      width="11.7966"
      height="11.7966"
      rx="5.8983"
      transform="matrix(-1 0 0 1 11.7966 0)"
      stroke="#0E0E11"
      strokeWidth="0.20339"
    />
    <path
      d="M2.80125 8.40137C4.12914 8.40137 5.2056 7.327 5.2056 6.00171C5.2056 4.67641 4.12914 3.60205 2.80125 3.60205M9 3.59918C7.67211 3.59918 6.59565 4.67354 6.59565 5.99884C6.59565 7.32413 7.67211 8.39849 9 8.39849M8.99344 6.02955H2.78532"
      stroke="#0E0E11"
      strokeWidth="0.789949"
    />
  </svg>
);

const TorusEvmSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 12 13"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="-0.101695"
      y="0.101695"
      width="11.7966"
      height="11.7966"
      rx="5.8983"
      transform="matrix(-1 0 0 1 11.7966 0.5)"
      fill="#A1A1AB"
    />
    <rect
      x="-0.101695"
      y="0.101695"
      width="11.7966"
      height="11.7966"
      rx="5.8983"
      transform="matrix(-1 0 0 1 11.7966 0.5)"
      stroke="#0E0E11"
      strokeWidth="0.20339"
    />
    <path
      d="M2.80125 8.90088C4.12914 8.90088 5.2056 7.82651 5.2056 6.50122C5.2056 5.17592 4.12914 4.10156 2.80125 4.10156M9 4.09869C7.67211 4.09869 6.59565 5.17305 6.59565 6.49835C6.59565 7.82364 7.67211 8.89801 9 8.89801M8.99344 6.52906H2.78532"
      stroke="#0E0E11"
      strokeWidth="0.789949"
    />
    <rect x="4.15" y="4.65" width="3.7" height="3.7" rx="1.85" fill="#A1A1AA" />
    <rect
      x="4.15"
      y="4.65"
      width="3.7"
      height="3.7"
      rx="1.85"
      stroke="#0E0E11"
      strokeWidth="0.3"
    />
    <path d="M4 6.50039L6.8 6.50195" stroke="#0E0E11" strokeWidth="0.4" />
  </svg>
);

const TorusBaseSVG = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="0.0847458"
      y="0.0847458"
      width="9.83051"
      height="9.83051"
      rx="4.91525"
      fill="#A1A1AA"
    />
    <rect
      x="0.0847458"
      y="0.0847458"
      width="9.83051"
      height="9.83051"
      rx="4.91525"
      stroke="#0E0E11"
      strokeWidth="0.169492"
    />
    <path d="M0 5L7 5.00391" stroke="#0E0E11" />
  </svg>
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

  const {
    data: baseBalance,
    error: baseBalanceError,
    isLoading: baseBalanceLoading,
  } = wagmi.useReadContract({
    chainId: baseChain.id,
    address: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867",
    abi: erc20Abi,
    functionName: "balanceOf",
    args: evmAddress ? [evmAddress] : undefined,
  });

  // Debug logs for Base balance
  React.useEffect(() => {
    console.log("Base Balance Debug:", {
      evmAddress,
      baseChainId: baseChain.id,
      baseBalance: baseBalance?.toString(),
      baseBalanceError,
      baseBalanceLoading,
      contractAddress: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867",
    });
  }, [
    baseBalance,
    baseBalanceError,
    baseBalanceLoading,
    evmAddress,
    baseChain.id,
  ]);

  const balancesList = [
    {
      amount: userAccountFreeBalance(),
      asset: "TORUS",
      label: "Torus Balance",
      icon: <TorusNativeSVG />,
      address: selectedAccount?.address,
    },
    {
      amount: torusEvmBalance?.value ?? null,
      asset: "EVM",
      label: "Torus EVM Balance",
      icon: <TorusEvmSVG />,
      address: evmAddress,
    },
    {
      amount: baseBalance ?? null,
      asset: "BASE",
      label: "Base Balance",
      icon: <TorusBaseSVG />,
      address: evmAddress,
    },
  ];

  return (
    <Card className="flex w-full flex-col gap-6 p-4">
      {balancesList.map((item) => (
        <div key={item.label} className="flex flex-col gap-1">
          {/* Balance value - exact CSS specs */}
          {item.amount == null ? (
            <Skeleton className="h-5 w-24" />
          ) : (
            <div className="-my-0.5 text-sm font-semibold leading-5 text-white">
              {formatToken(item.amount)} {item.asset}
            </div>
          )}

          <div className="flex items-center gap-2">
            {item.icon}
            <span className="text-xs leading-5 text-zinc-400">
              {item.label}
            </span>
          </div>
        </div>
      ))}
    </Card>
  );
}
