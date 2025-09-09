"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { calculatePostPenaltyEmission } from "~/hooks/use-post-penalty-emission";
import { api } from "~/trpc/react";
import { useMemo } from "react";
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

      // Calculate post-penalty emission percentage using utility function
      const postPenaltyPercent = calculatePostPenaltyEmission(
        agentWeight?.percComputedWeight,
        agentWeight?.weightFactor,
      );

      const networkAllocation = agentWeight
        ? (signal.proposedAllocation * postPenaltyPercent) / 100
        : 0;

      return {
        ...signal,
        agentName: agentWeight?.agentName ?? "Unknown Agent",
        agentPercWeight: postPenaltyPercent,
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
      <div className="bg-muted mt-6 flex items-center justify-center rounded-md p-6">
        <div className="text-muted-foreground">Loading deleted signals...</div>
      </div>
    );
  }

  if (rankedSignals.length === 0) {
    return (
      <div className="bg-muted mt-6 flex items-center justify-center rounded-md p-6">
        <div className="text-muted-foreground">No deleted signals found.</div>
      </div>
    );
  }

  return <SignalAccordion signals={rankedSignals} variant="deleted" />;
}
