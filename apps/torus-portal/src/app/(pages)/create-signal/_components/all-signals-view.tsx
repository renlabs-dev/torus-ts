"use client";

import { useMemo } from "react";

import { Badge } from "@torus-ts/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";

import { api } from "~/trpc/react";

export default function AllSignalsView() {
  // Query for all signals
  const { data: allSignals, isLoading: isLoadingSignals } =
    api.signal.all.useQuery();

  // Query for computed agent weights to calculate network allocations
  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    api.computedAgentWeight.all.useQuery();

  // Calculate network weight allocations and sort signals
  const rankedSignals = useMemo(() => {
    if (!allSignals || !allComputedWeights) return [];

    return allSignals
      .map((signal) => {
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
        };
      })
      .sort((a, b) => b.networkAllocation - a.networkAllocation); // Sort by network allocation descending
  }, [allSignals, allComputedWeights]);

  if (isLoadingSignals || isLoadingWeights) {
    return (
      <Card className="border-0 w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-muted-foreground">Loading signals...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rankedSignals.length) {
    return (
      <Card className="border-0 w-full max-w-2xl mx-auto">
        <CardHeader className="px-4 sm:px-6">
          <CardTitle>All Demand Signals</CardTitle>
          <CardDescription>
            View all demand signals ranked by their network weight allocation.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="text-center py-8">
            <div className="text-muted-foreground">No signals found.</div>
            <div className="text-sm text-muted-foreground mt-1">
              Be the first to create a demand signal!
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 pb-12 w-full max-w-fit md:max-w-2xl mx-auto overflow-hidden">
      <CardHeader className="px-4 sm:px-6">
        <CardTitle>All Demand Signals</CardTitle>
        <CardDescription>
          View all demand signals ranked by their network weight allocation.
          Higher network weight allocations appear first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 px-4 sm:px-6 overflow-hidden">
        {rankedSignals.map((signal, index) => (
          <Card
            key={signal.id || index}
            className="border border-border w-full overflow-hidden"
          >
            <CardContent className="p-3 sm:p-4 overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3 w-full">
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="font-semibold text-lg mb-1 break-words overflow-wrap-anywhere">
                    {signal.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="truncate">by {signal.agentName}</span>
                  </div>
                </div>
                <div className="flex gap-2 sm:gap-4 shrink-0 text-xs sm:text-sm">
                  <div className="text-center sm:text-right">
                    <div className="text-sm sm:text-lg font-bold text-primary">
                      {signal.networkAllocation.toFixed(4)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Network Weight
                    </div>
                  </div>
                  <div className="text-center sm:text-right">
                    <div className="text-sm sm:text-lg font-bold text-primary">
                      {signal.proposedAllocation}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Agent Allocation
                    </div>
                  </div>
                </div>
              </div>

              {signal.description && (
                <div className="border-t pt-3 overflow-hidden w-full">
                  <p className="overflow-clip"> {signal.description}</p>
                </div>
              )}

              {/* Contact Information */}
              {(signal.discord ??
                signal.github ??
                signal.telegram ??
                signal.twitter) && (
                <div className="border-t pt-3 mt-3 overflow-hidden">
                  <div className="text-sm text-muted-foreground mb-2">
                    Contact
                  </div>
                  <div className="flex flex-wrap gap-1 sm:gap-2 w-full">
                    {signal.discord && (
                      <Badge
                        variant="secondary"
                        className="text-xs break-all max-w-full overflow-hidden"
                      >
                        Discord:{" "}
                        <span className="truncate">{signal.discord}</span>
                      </Badge>
                    )}
                    {signal.github && (
                      <Badge
                        variant="secondary"
                        className="text-xs break-all max-w-full overflow-hidden"
                      >
                        GitHub:{" "}
                        <span className="truncate">{signal.github}</span>
                      </Badge>
                    )}
                    {signal.telegram && (
                      <Badge
                        variant="secondary"
                        className="text-xs break-all max-w-full overflow-hidden"
                      >
                        Telegram:{" "}
                        <span className="truncate">{signal.telegram}</span>
                      </Badge>
                    )}
                    {signal.twitter && (
                      <Badge
                        variant="secondary"
                        className="text-xs break-all max-w-full overflow-hidden"
                      >
                        Twitter:{" "}
                        <span className="truncate">{signal.twitter}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
