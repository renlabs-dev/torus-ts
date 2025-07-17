import { useMemo } from "react";

import type { Api, SS58Address } from "@torus-network/sdk";

import { useNamespacePathCreationCost } from "@torus-ts/query-provider/hooks";

interface NamespaceCreationFeeResult {
  isLoading: boolean;
  error: string | null;
  feeItems: {
    label: string;
    amount: bigint;
    description?: string;
  }[];
  totalAmount: bigint;
}

export function useNamespaceCreationFee(
  api: Api | null,
  account: SS58Address | null,
  fullPath: string,
): NamespaceCreationFeeResult {
  const {
    data: namespaceCost,
    isLoading,
    error,
  } = useNamespacePathCreationCost(api, account, fullPath);

  return useMemo(() => {
    if (isLoading) {
      return {
        isLoading: true,
        error: null,
        feeItems: [
          {
            label: "Transaction Fee",
            amount: 0n,
          },
          {
            label: "Deposit",
            amount: 0n,
            description: "Reserved, can be reclaimed when capability is deleted",
          },
        ],
        totalAmount: 0n,
      };
    }

    if (error) {
      return {
        isLoading: false,
        error: error.message,
        feeItems: [],
        totalAmount: 0n,
      };
    }

    if (!namespaceCost) {
      return {
        isLoading: false,
        error: null,
        feeItems: [],
        totalAmount: 0n,
      };
    }

    const [queryError, costData] = namespaceCost;

    if (queryError) {
      return {
        isLoading: false,
        error: queryError.message,
        feeItems: [],
        totalAmount: 0n,
      };
    }

    const feeItems = [
      {
        label: "Transaction Fee",
        amount: costData.fee,
      },
      {
        label: "Deposit",
        amount: costData.deposit,
        description: "Reserved, can be reclaimed when capability is deleted",
      },
    ];

    return {
      isLoading: false,
      error: null,
      feeItems,
      totalAmount: costData.fee + costData.deposit,
    };
  }, [namespaceCost, isLoading, error]);
}
