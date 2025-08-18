"use client";

import { Coins, Globe, Key } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";

import { CardContent } from "../card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { Label } from "../label";
import { Separator } from "../separator";
import { SkeletonAgentCardContent } from "./agent-card-skeleton-loader";

export interface AccountEmissionData {
  isLoading: boolean;
  isError: boolean;
  root: {
    tokensPerWeek: number;
    percentage: number;
  };
  streams: {
    incoming: {
      tokensPerWeek: number;
      percentage: number;
      count: number;
    };
    outgoing: {
      tokensPerWeek: number;
      percentage: number;
      count: number;
    };
    net: {
      tokensPerWeek: number;
      percentage: number;
    };
  };
  total: {
    tokensPerWeek: number;
    percentage: number;
  };
  totalWithoutOutgoing: {
    tokensPerWeek: number;
    percentage: number;
  };
  displayValues: {
    totalWithoutOutgoing: string;
    totalEmission: string;
    rootEmission: string;
    incomingStreams: string;
    outgoingStreams: string;
    netStreams: string;
  };
  hasCalculatingStreams: boolean;
}

interface AgentCardContentProps {
  shortDescription?: string;
  agentKey: string;
  percComputedWeight?: number | null;
  tokensPerWeek?: string;
  isLoading?: boolean;
  isStatsLoading?: boolean;
  // Optional: show penalty details in tooltip when provided
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
  // Enhanced emission data
  emissionData?: AccountEmissionData;
}

function AgentStats({
  percComputedWeight,
  tokensPerWeek,
  agentKey,
  isLoading = false,
  prePenaltyPercent,
  penaltyFactor,
  emissionData,
}: {
  agentKey: string;
  percComputedWeight?: number | null;
  tokensPerWeek?: string;
  usdValue?: string;
  isLoading?: boolean;
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
  emissionData?: AccountEmissionData;
}) {
  const isMobile = useIsMobile();

  // Calculate display values - prioritize emission data if available
  const displayPercentage =
    emissionData?.totalWithoutOutgoing.percentage ??
    (percComputedWeight ? percComputedWeight * 100 : null);

  const shouldShowTokensPerWeek =
    emissionData?.displayValues.totalWithoutOutgoing &&
    !emissionData.displayValues.totalWithoutOutgoing.startsWith("0.00") &&
    !emissionData.displayValues.totalWithoutOutgoing.startsWith("0 ") ||
    (tokensPerWeek &&
     !tokensPerWeek.startsWith("0.00") &&
     !tokensPerWeek.startsWith("0 "));

  // Always show stats section to display address and other info
  // Individual stats will show "-" for missing values

  return (
    <div className="relative z-30 flex w-full flex-wrap items-center justify-between gap-3">
      {/* Emission Percentage with detailed tooltip */}
      <HoverCard>
        <HoverCardTrigger className="z-[100]">
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Globe size={14} />
            {isLoading || emissionData?.isLoading
              ? "Loading..."
              : displayPercentage !== null
                ? `${displayPercentage.toFixed(2)}%`
                : "-"}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-96">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Total Emission Allocation</p>
              <p className="text-xs text-muted-foreground">
                Root emissions + incoming streams (before forwarding outgoing
                streams)
              </p>
            </div>

            {emissionData && !emissionData.isLoading && (
              <div className="space-y-2 text-xs">
                <div className="space-y-1 rounded-md bg-muted p-2">
                  <div className="flex justify-between">
                    <span>Root Emission:</span>
                    <span className="font-mono">
                      {emissionData.displayValues.rootEmission}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Incoming Streams:</span>
                    <span className="font-mono">
                      {emissionData.displayValues.incomingStreams}
                    </span>
                  </div>
                  {emissionData.streams.incoming.count > 0 && (
                    <div className="text-muted-foreground">
                      From {emissionData.streams.incoming.count} stream
                      {emissionData.streams.incoming.count !== 1 ? "s" : ""}
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span className="font-mono">
                      {emissionData.displayValues.totalWithoutOutgoing}
                    </span>
                  </div>
                </div>

                {emissionData.streams.outgoing.tokensPerWeek > 0 && (
                  <div className="space-y-1 rounded-md bg-orange-50 dark:bg-orange-950/20 p-2">
                    <div className="flex justify-between text-orange-700 dark:text-orange-300">
                      <span>Forwarding Out:</span>
                      <span className="font-mono">
                        -{emissionData.displayValues.outgoingStreams}
                      </span>
                    </div>
                    {emissionData.streams.outgoing.count > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        To {emissionData.streams.outgoing.count} stream
                        {emissionData.streams.outgoing.count !== 1 ? "s" : ""}
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between font-medium text-orange-800 dark:text-orange-200">
                      <span>Net Total:</span>
                      <span className="font-mono">
                        {emissionData.displayValues.totalEmission}
                      </span>
                    </div>
                  </div>
                )}

                {typeof penaltyFactor === "number" &&
                  !Number.isNaN(penaltyFactor) &&
                  penaltyFactor < 1 && (
                    <div
                      className="space-y-1 rounded-md bg-red-50 dark:bg-red-950/20 p-2 text-red-700
                        dark:text-red-300"
                    >
                      {typeof prePenaltyPercent === "number" &&
                        !Number.isNaN(prePenaltyPercent) && (
                          <div className="flex justify-between text-xs">
                            <span>Before penalty:</span>
                            <span>{(prePenaltyPercent * 100).toFixed(2)}%</span>
                          </div>
                        )}
                      <div className="flex justify-between text-xs">
                        <span>Penalty factor:</span>
                        <span>{(penaltyFactor * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Fallback content when no emission data is available */}
            {!emissionData && (
              <div className="space-y-2">
                <p className="text-sm">Current emission allocated to this agent.</p>
                {typeof penaltyFactor === "number" &&
                  !Number.isNaN(penaltyFactor) &&
                  penaltyFactor > 0 && (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {typeof prePenaltyPercent === "number" &&
                        !Number.isNaN(prePenaltyPercent) && (
                          <div>
                            Before penalty: {(prePenaltyPercent * 100).toFixed(2)}%
                          </div>
                        )}
                      <div>Penalty applied: {penaltyFactor.toFixed(2)}%</div>
                      {typeof percComputedWeight === "number" &&
                        !Number.isNaN(percComputedWeight) && (
                          <div>
                            After penalty: {(percComputedWeight * 100).toFixed(2)}%
                          </div>
                        )}
                    </div>
                  )}
              </div>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      {/* Tokens Per Week with detailed tooltip */}
      <HoverCard>
        <HoverCardTrigger>
          <Label className="flex items-center gap-1 text-xs font-semibold">
            <Coins size={16} />
            {isLoading || emissionData?.isLoading
              ? "Loading..."
              : shouldShowTokensPerWeek
                ? emissionData?.displayValues.totalWithoutOutgoing || tokensPerWeek
                : "-"}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {emissionData ? "Tokens per week (before forwarding)" : "Tokens per week"}
            </p>
            <p className="text-xs text-muted-foreground">
              {emissionData
                ? "Total tokens this agent receives per week, including root emissions and incoming streams, but before forwarding any outgoing streams."
                : "Total tokens this agent receives per week."}
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>

      <Label className="flex items-center gap-1 text-xs font-semibold">
        <Key size={14} />
        {smallAddress(agentKey, isMobile ? 3 : 6)}
      </Label>
    </div>
  );
}

export function AgentCardContent({
  shortDescription,
  agentKey,
  percComputedWeight,
  tokensPerWeek,
  isLoading = false,
  isStatsLoading = false,
  prePenaltyPercent,
  penaltyFactor,
  emissionData,
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
            tokensPerWeek={tokensPerWeek}
            isLoading={isStatsLoading}
            prePenaltyPercent={prePenaltyPercent}
            penaltyFactor={penaltyFactor}
            emissionData={emissionData}
          />
        </div>
        <Separator />
        <p className="line-clamp-3 break-words text-sm">{shortDescription}</p>
      </div>
    </CardContent>
  );
}
