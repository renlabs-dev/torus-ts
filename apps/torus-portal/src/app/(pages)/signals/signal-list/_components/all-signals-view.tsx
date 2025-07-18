"use client";

import { useMemo } from "react";

import { Check, Radio, Trash2 } from "lucide-react";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";

import PortalFormHeader from "~/app/_components/portal-form-header";
import { api } from "~/trpc/react";

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
              className={`px-4
                ${signal.fulfilled ? "bg-green-500/5 border-green-500 border-b" : "bg-muted/50"}`}
            >
              <AccordionTrigger className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-left w-full">
                  <Badge>#{index + 1}</Badge>

                  <div>
                    <h3 className="font-medium">{signal.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {signal.agentName}
                    </p>
                  </div>
                </div>
                <div className="flex">
                  {signal.fulfilled && (
                    <Badge className="bg-green-500 text-white gap-1 mr-2">
                      <Check className="w-3 h-3" />
                      Fulfilled
                    </Badge>
                  )}
                  {signal.isCurrentUser && (
                    <Badge className="text-nowrap mr-2 sm:block hidden">
                      Your Signal
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex md:flex-row flex-col gap-2 items-center justify-between">
                    <div className="grid grid-cols-2 gap-4 flex-1">
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
                    {signal.isCurrentUser && (
                      <div className="flex gap-2">
                        {!signal.fulfilled && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              fulfillSignalMutation.mutate({
                                signalId: signal.id,
                              });
                            }}
                            disabled={fulfillSignalMutation.isPending}
                            className="bg-green-500 hover:bg-green-600"
                          >
                            <Radio className="w-4 h-4" />
                            {fulfillSignalMutation.isPending
                              ? "Fulfilling..."
                              : "Fulfill"}
                          </Button>
                        )}
                        {!signal.fulfilled && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSignalMutation.mutate({
                                signalId: signal.id,
                              });
                            }}
                            disabled={deleteSignalMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                            {deleteSignalMutation.isPending
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        )}
                      </div>
                    )}
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
