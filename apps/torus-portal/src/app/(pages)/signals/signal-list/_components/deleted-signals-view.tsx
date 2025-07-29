"use client";

import { useMemo } from "react";

import { useTorus } from "@torus-ts/torus-provider";

import { api } from "~/trpc/react";

import SignalAccordion from "./signal-accordion";

export default function DeletedSignalsView() {
  const { selectedAccount } = useTorus();
  const currentUserKey = selectedAccount?.address;

  const { data: deletedSignals, isLoading: isLoadingSignals } =
    api.signal.deleted.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    api.computedAgentWeight.all.useQuery();

  const rankedSignals = useMemo(() => {
    if (!deletedSignals || !allComputedWeights) return [];

    const signalsWithMetadata = deletedSignals.map((signal) => {
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
  }, [deletedSignals, allComputedWeights, currentUserKey]);

  if (isLoadingSignals || isLoadingWeights) {
    return (
      <div className="flex items-center justify-center mt-6 p-6 bg-muted rounded-md">
        <div className="text-muted-foreground">Loading deleted signals...</div>
      </div>
    );
  }

  if (rankedSignals.length === 0) {
    return (
      <div className="flex items-center justify-center mt-6 p-6 bg-muted rounded-md">
        <div className="text-muted-foreground">No deleted signals found.</div>
      </div>
    );
  }

  return <SignalAccordion signals={rankedSignals} variant="deleted" />;
}
