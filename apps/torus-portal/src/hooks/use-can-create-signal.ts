"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { api } from "~/trpc/react";

/**
 * Hook to check if the current user can create signals.
 * Users can create signals if they are either:
 * - Root agents (registered in the agent schema)
 * - Targets of emission permissions (have emission distribution targets)
 */
export function useCanCreateSignal() {
  const { selectedAccount, isAccountConnected } = useTorus();
  const userKey = selectedAccount?.address ?? "";

  const rootAgent = api.computedAgentWeight.byAgentKey.useQuery(
    { agentKey: userKey },
    { enabled: isAccountConnected && !!userKey },
  );

  const emissionTargets =
    api.permission.distributionTargetsByAccountId.useQuery(
      { accountId: userKey },
      { enabled: isAccountConnected && !!userKey },
    );

  const canCreate = !!(
    rootAgent.data?.agentKey ??
    (emissionTargets.data && emissionTargets.data.length > 0)
  );

  const isLoading = rootAgent.isLoading || emissionTargets.isLoading;

  return {
    canCreate,
    isLoading,
    isRootAgent: !!rootAgent.data?.agentKey,
    isEmissionTarget: !!(
      emissionTargets.data && emissionTargets.data.length > 0
    ),
  };
}
