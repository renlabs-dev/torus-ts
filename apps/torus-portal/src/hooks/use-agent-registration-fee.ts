import { useMemo } from "react";

import type { Api, SS58Address } from "@torus-network/sdk";

import {
  useBurnValue,
  useNamespacePathCreationCost,
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

  return useMemo(() => {
    const isLoading = isLoadingNamespace || isLoadingBurn;

    if (isLoading) {
      return {
        isLoading: true,
        error: null,
        feeItems: [],
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

    if (!namespaceCost || !burnValue) {
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
        burnValue + namespaceCostData.fee + namespaceCostData.deposit,
    };
  }, [
    namespaceCost,
    burnValue,
    isLoadingNamespace,
    isLoadingBurn,
    namespaceError,
    burnError,
  ]);
}
