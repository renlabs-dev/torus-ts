"use client";

import { Coins, Key, Route } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";

import { CardContent } from "../card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { Label } from "../label";
import { Separator } from "../separator";
import type { AccountEmissionData } from "./agent-card";
import { SkeletonAgentCardContent } from "./agent-card-skeleton-loader";

interface AgentCardContentProps {
  shortDescription?: string;
  agentKey: string;
  percComputedWeight?: number | null;
  emissionData?: AccountEmissionData;
  isLoading?: boolean;
  isStatsLoading?: boolean;
  // Optional: show penalty details in tooltip when provided
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
}

function AgentStats({
  percComputedWeight,
  emissionData,
  agentKey,
  isLoading = false,
  penaltyFactor,
}: {
  agentKey: string;
  percComputedWeight?: number | null;
  emissionData?: AccountEmissionData;
  usdValue?: string;
  isLoading?: boolean;
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
}) {
  const isMobile = useIsMobile();

  const tokensPerWeekDisplay =
    emissionData?.displayValues.totalWithoutOutgoing ?? "0.00 TORUS";

  // Format percentage display
  const formatPercentage = (value: number) => {
    return (
      value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "%"
    );
  };

  const twp = emissionData?.totalWithoutOutgoing.percentage;
  const percentageDisplay =
    typeof twp === "number"
      ? formatPercentage(twp)
      : typeof percComputedWeight === "number"
        ? formatPercentage(percComputedWeight * 100)
        : "0.00%";

  return (
    <div className="relative z-30 flex w-full flex-wrap items-center justify-between gap-3">
      <HoverCard>
        <HoverCardTrigger>
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Route size={14} />
            {isLoading ? (
              <span className="animate-pulse">00.00%</span>
            ) : (
              percentageDisplay
            )}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="z-[9999] w-80" side="top" align="center">
          <div className="space-y-3">
            <p className="text-sm font-medium">Emission Percentage Breakdown</p>
            {emissionData ? (
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Root emission:</span>
                    <span className="font-mono">
                      {formatPercentage(emissionData.root.percentage)}
                      {typeof penaltyFactor === "number" &&
                        !Number.isNaN(penaltyFactor) &&
                        penaltyFactor > 0 && (
                          <span className="ml-1 text-muted-foreground">
                            (-{penaltyFactor.toFixed(1)}%)
                          </span>
                        )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incoming streams:</span>
                    <span className="font-mono">
                      {formatPercentage(
                        emissionData.streams.incoming.percentage,
                      )}
                    </span>
                  </div>
                  <div className="mb-1 flex justify-between">
                    <span>Outgoing streams:</span>
                    <span className="font-mono">
                      {formatPercentage(
                        emissionData.streams.outgoing.percentage,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-medium">
                    <span>Total (without outgoing):</span>
                    <span className="font-mono">
                      {formatPercentage(
                        emissionData.totalWithoutOutgoing.percentage,
                      )}
                    </span>
                  </div>
                </div>

                {emissionData.hasCalculatingStreams && (
                  <div className="border-t pt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Some streams are still calculating
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="text-sm">Loading emission data...</p>
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger>
          <Label className="flex items-center gap-1 text-xs font-semibold">
            <Coins size={16} />
            {isLoading ? (
              <span className="animate-pulse">00.00 TORUS/Week</span>
            ) : (
              <span>{tokensPerWeekDisplay}/Week</span>
            )}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="z-[9999] w-80" side="top" align="center">
          <div className="space-y-3">
            <p className="text-sm font-medium">Tokens Breakdown</p>
            {emissionData ? (
              <div className="space-y-2 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Root emission:</span>
                    <span className="font-mono">
                      {emissionData.displayValues.rootEmission}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Incoming streams:</span>
                    <span className="font-mono">
                      {emissionData.displayValues.incomingStreams}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outgoing streams:</span>
                    <span className="font-mono">
                      {emissionData.displayValues.outgoingStreams}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-1 font-medium">
                    <span>Total (without outgoing):</span>
                    <span className="font-mono">
                      {emissionData.displayValues.totalWithoutOutgoing}
                    </span>
                  </div>
                </div>

                {emissionData.hasCalculatingStreams && (
                  <div className="border-t pt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠️ Some streams are still calculating
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Loading emission data...
              </p>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      <Label className="flex items-center gap-1 text-xs font-semibold">
        <Key size={14} />
        {smallAddress(agentKey, isMobile ? 3 : 4)}
      </Label>
    </div>
  );
}

export function AgentCardContent({
  shortDescription,
  agentKey,
  percComputedWeight,
  emissionData,
  isLoading = false,
  isStatsLoading = false,
  prePenaltyPercent,
  penaltyFactor,
}: Readonly<AgentCardContentProps>) {
  if (isLoading) {
    return <SkeletonAgentCardContent />;
  }

  return (
    <CardContent>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <AgentStats
            agentKey={agentKey}
            percComputedWeight={percComputedWeight}
            emissionData={emissionData}
            isLoading={isStatsLoading}
            prePenaltyPercent={prePenaltyPercent}
            penaltyFactor={penaltyFactor}
          />
        </div>
        <Separator />
        <p className="line-clamp-3 break-words text-sm">{shortDescription}</p>
      </div>
    </CardContent>
  );
}
