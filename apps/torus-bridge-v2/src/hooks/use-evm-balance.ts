import { torusEvm } from "~/lib/chain";
import { formatEther } from "viem";
import { useBalance } from "wagmi";

export interface EvmBalance {
  balance: bigint | undefined;
  balanceFormatted: string;
  isLoading: boolean;
}

export function useEvmBalance(address: `0x${string}` | undefined): EvmBalance {
  const { data, isLoading } = useBalance({
    address,
    chainId: torusEvm.id,
    query: { enabled: address !== undefined, refetchInterval: 10_000 },
  });

  return {
    balance: data?.value,
    balanceFormatted: data?.value !== undefined ? formatEther(data.value) : "0",
    isLoading,
  };
}
