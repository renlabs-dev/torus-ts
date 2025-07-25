"use client";

import { useMemo } from "react";

import { useTorus } from "@torus-ts/torus-provider";

import { api } from "~/trpc/react";

import SignalAccordion from "./signal-accordion";

export default function AllSignalsView() {
  const { selectedAccount } = useTorus();
  const currentUserKey = selectedAccount?.address;

  const { data: allSignals, isLoading: isLoadingSignals } =
    api.signal.all.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    api.computedAgentWeight.all.useQuery();

  const utils = api.useUtils();
  const deleteSignalMutation = api.signal.delete.useMutation({
    onSuccess: () => {
      void utils.signal.all.invalidate();
    },
  });

  const fulfillSignalMutation = api.signal.fulfill.useMutation({
    onSuccess: () => {
      void utils.signal.all.invalidate();
    },
  });

  const rankedSignals = useMemo(() => {
    if (!allSignals || !allComputedWeights) return [];

    const signalsWithMetadata = allSignals.map((signal) => {
      const agentWeight = allComputedWeights.find(
        (weight) => weight.agentKey === signal.agentKey,
      );
      const networkAllocation = agentWeight
        ? (signal.proposedAllocation * agentWeight.percComputedWeight) / 100
        : 0;

      return {
        ...signal,
        agentName: agentWeight?.agentName ?? "Unknown Agent",
        agentPercWeight: agentWeight?.percComputedWeight ?? 0,
        networkAllocation,
        isCurrentUser: currentUserKey === signal.agentKey,
      };
    });

    return signalsWithMetadata.sort((a, b) => {
      if (a.isCurrentUser && !b.isCurrentUser) return -1;
      if (!a.isCurrentUser && b.isCurrentUser) return 1;
      return b.networkAllocation - a.networkAllocation;
    });
  }, [allSignals, allComputedWeights, currentUserKey]);

  if (isLoadingSignals || isLoadingWeights) {
    return (
      <div className="flex items-center justify-center mt-6 p-6 bg-muted rounded-md">
        <div className="text-muted-foreground">Loading signals...</div>
      </div>
    );
  }

  if (rankedSignals.length === 0) {
    return (
      <div className="flex items-center justify-center mt-6 p-6 bg-muted rounded-md">
        <div className="text-muted-foreground">No active signals found.</div>
      </div>
    );
  }

  return (
    <SignalAccordion
      signals={rankedSignals}
      onDelete={(signalId) => deleteSignalMutation.mutate({ signalId })}
      onFulfill={(signalId) => fulfillSignalMutation.mutate({ signalId })}
      isDeletingSignal={deleteSignalMutation.isPending}
      isFulfillingSignal={fulfillSignalMutation.isPending}
      variant="active"
    />
  );
}
