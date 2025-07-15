"use client";

import { useMemo } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Badge } from "@torus-ts/ui/components/badge";

import PortalFormHeader from "~/app/_components/portal-form-header";
import { api } from "~/trpc/react";

export default function AllSignalsView() {
  const { data: allSignals, isLoading: isLoadingSignals } =
    api.signal.all.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    api.computedAgentWeight.all.useQuery();

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
      .sort((a, b) => b.networkAllocation - a.networkAllocation);
  }, [allSignals, allComputedWeights]);

  return (
    <>
      <PortalFormHeader
        title="Demand Signals"
        description="View all demand signals ranked by their network weight allocation."
      />
      {isLoadingSignals || isLoadingWeights ? (
        <div className="flex items-center justify-center mt-6 p-6 bg-muted rounded-md">
          <div className="text-muted-foreground">Loading signals...</div>
        </div>
      ) : (
        <Accordion type="single" collapsible className="mt-6 space-y-4">
          {rankedSignals.map((signal, index) => (
            <AccordionItem
              key={signal.id || index}
              value={`signal-${index}`}
              className="bg-muted/50 px-4"
            >
              <AccordionTrigger>
                <div className="flex items-center gap-3 text-left">
                  <Badge variant="secondary">#{index + 1}</Badge>
                  <div>
                    <h3 className="font-medium">{signal.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {signal.agentName}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Agent Weight
                      </p>
                      <p className="text-xl font-semibold">
                        {signal.agentPercWeight.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Proposed Allocation
                      </p>
                      <p className="text-xl font-semibold">
                        {signal.proposedAllocation}%
                      </p>
                    </div>
                  </div>

                  {signal.description && (
                    <div className="pt-4 border-t">
                      <p className="text-sm">{signal.description}</p>
                    </div>
                  )}

                  {(signal.discord ??
                    signal.github ??
                    signal.telegram ??
                    signal.twitter) && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">
                        Contact
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {signal.discord && (
                          <Badge variant="secondary" className="text-xs">
                            Discord: {signal.discord}
                          </Badge>
                        )}
                        {signal.github && (
                          <Badge variant="secondary" className="text-xs">
                            GitHub: {signal.github}
                          </Badge>
                        )}
                        {signal.telegram && (
                          <Badge variant="secondary" className="text-xs">
                            Telegram: {signal.telegram}
                          </Badge>
                        )}
                        {signal.twitter && (
                          <Badge variant="secondary" className="text-xs">
                            Twitter: {signal.twitter}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}
