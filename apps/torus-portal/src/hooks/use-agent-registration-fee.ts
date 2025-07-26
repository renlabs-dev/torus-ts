import { useMemo } from "react";

import type { ApiPromise } from "@polkadot/api";

import type { Api } from "@torus-network/sdk/chain";
import { registerAgent } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";

import {
  useBurnValue,
  useNamespacePathCreationCost,
  useTransactionFee,
} from "@torus-ts/query-provider/hooks";

interface AgentRegistrationFeeResult {
  isLoading: boolean;
  error: string | null;
  feeItems: {
    label: string;
    amount: bigint;
    description?: string;
  }[];
  totalAmount: bigint;
}

export function useAgentRegistrationFee(
  api: Api | null,
  account: SS58Address | null,
  agentName: string,
): AgentRegistrationFeeResult {
  const agentNamespacePath = agentName ? `agent.${agentName}` : "";

  const {
    data: namespaceCost,
    isLoading: isLoadingNamespace,
    error: namespaceError,
  } = useNamespacePathCreationCost(api, account, agentNamespacePath);

  const {
    data: burnValue,
    isLoading: isLoadingBurn,
    error: burnError,
  } = useBurnValue(api);

  const extrinsic = useMemo(() => {
    if (!api || !account) return null;
    return registerAgent({
      api: api as ApiPromise,
      name: "placeholder-name",
      url: "placeholder-url",
      metadata: "placeholder-metadata",
    });
  }, [api, account]);

  const {
    data: transactionFee,
    isLoading: isLoadingTxFee,
    error: txFeeError,
  } = useTransactionFee(extrinsic, account);

  return useMemo(() => {
    const isLoading = isLoadingNamespace || isLoadingBurn || isLoadingTxFee;

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
            label: "Agent Registration Fee",
            amount: 0n,
            description: "15 TORUS burned for registration",
          },
          {
            label: "Capability Creation Fee",
            amount: 0n,
            description: "Transaction fee for creating agent capability",
          },
          {
            label: "Capability Deposit",
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

    if (burnError) {
      return {
        isLoading: false,
        error: burnError.message,
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

    if (!namespaceCost || !burnValue || !transactionFee) {
      return {
        isLoading: false,
        error: null,
        feeItems: [],
        totalAmount: 0n,
      };
    }

    const [namespaceQueryError, namespaceCostData] = namespaceCost;

    if (namespaceQueryError) {
      return {
        isLoading: false,
        error: namespaceQueryError.message,
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
        label: "Agent Registration Fee",
        amount: burnValue,
        description: "15 TORUS burned for registration",
      },
      {
        label: "Capability Creation Fee",
        amount: namespaceCostData.fee,
        description: "Transaction fee for creating agent capability",
      },
      {
        label: "Capability Deposit",
        amount: namespaceCostData.deposit,
        description: "Reserved, can be reclaimed when capability is deleted",
      },
    ];

    return {
      isLoading: false,
      error: null,
      feeItems,
      totalAmount:
        transactionFee +
        burnValue +
        namespaceCostData.fee +
        namespaceCostData.deposit,
    };
  }, [
    namespaceCost,
    burnValue,
    transactionFee,
    isLoadingNamespace,
    isLoadingBurn,
    isLoadingTxFee,
    namespaceError,
    burnError,
    txFeeError,
  ]);
}
