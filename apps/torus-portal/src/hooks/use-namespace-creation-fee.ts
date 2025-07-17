import { useMemo } from "react";

import type { ApiPromise } from "@polkadot/api";

import type { Api, SS58Address } from "@torus-network/sdk";
import { createNamespace } from "@torus-network/sdk";

import {
  useNamespacePathCreationCost,
  useTransactionFee,
} from "@torus-ts/query-provider/hooks";

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
    isLoading: isLoadingNamespace,
    error: namespaceError,
  } = useNamespacePathCreationCost(api, account, fullPath);

  const extrinsic = useMemo(() => {
    if (!api || !account) return null;
    return createNamespace(api as ApiPromise, fullPath);
  }, [api, account, fullPath]);

  const {
    data: transactionFee,
    isLoading: isLoadingTxFee,
    error: txFeeError,
  } = useTransactionFee(extrinsic, account);

  return useMemo(() => {
    const isLoading = isLoadingNamespace || isLoadingTxFee;

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
            label: "Capability Creation Fee",
            amount: 0n,
            description: "Network fee for creating the capability",
          },
          {
            label: "Deposit",
            amount: 0n,
            description:
              "Reserved, can be reclaimed when capability is deleted",
          },
        ],
        totalAmount: 0n,
      };
    }

    if (namespaceError) {
      return {
        isLoading: false,
        error: namespaceError.message,
        feeItems: [],
        totalAmount: 0n,
      };
    }

    if (txFeeError) {
      return {
        isLoading: false,
        error: txFeeError.message,
        feeItems: [],
        totalAmount: 0n,
      };
    }

    if (!namespaceCost || !transactionFee) {
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
        amount: transactionFee,
      },
      {
        label: "Capability Creation Fee",
        amount: costData.fee,
        description: "Network fee for creating the capability",
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
      totalAmount: transactionFee + costData.fee + costData.deposit,
    };
  }, [
    namespaceCost,
    transactionFee,
    isLoadingNamespace,
    isLoadingTxFee,
    namespaceError,
    txFeeError,
  ]);
}
