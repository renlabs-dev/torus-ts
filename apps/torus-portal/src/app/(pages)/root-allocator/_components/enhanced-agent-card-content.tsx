"use client";

import { Coins, Globe, Key } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { CardContent } from "@torus-ts/ui/components/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@torus-ts/ui/components/hover-card";
import { Label } from "@torus-ts/ui/components/label";
import { Separator } from "@torus-ts/ui/components/separator";

import type { AccountEmissionData } from "~/hooks/use-multiple-account-emissions";

interface EnhancedAgentCardContentProps {
  shortDescription?: string;
  agentKey: string;
  percComputedWeight?: number | null;
  isLoading?: boolean;
  isStatsLoading?: boolean;
  emissionData?: AccountEmissionData;
  // Optional: show penalty details in tooltip when provided
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
}

function EnhancedAgentStats({
  percComputedWeight,
  agentKey,
  isLoading = false,
  emissionData,
  prePenaltyPercent,
  penaltyFactor,
}: {
  agentKey: string;
  percComputedWeight?: number | null;
  isLoading?: boolean;
  emissionData?: AccountEmissionData;
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
}) {
  const isMobile = useIsMobile();

  // Calculate display values
  const displayPercentage = emissionData?.totalWithoutOutgoing.percentage ?? 
    (percComputedWeight ? percComputedWeight * 100 : null);
  
  const shouldShowTokensPerWeek = 
    emissionData?.displayValues.totalWithoutOutgoing &&
    !emissionData.displayValues.totalWithoutOutgoing.startsWith("0.00") &&
    !emissionData.displayValues.totalWithoutOutgoing.startsWith("0 ");

  return (
    <div className="relative z-30 flex w-full flex-wrap items-center justify-between gap-3">
      {/* Emission Percentage with detailed tooltip */}
      <HoverCard>
        <HoverCardTrigger>
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
                Root emissions + incoming streams (before forwarding outgoing streams)
              </p>
            </div>
            
            {emissionData && !emissionData.isLoading && (
              <div className="space-y-2 text-xs">
                <div className="space-y-1 rounded-md bg-muted p-2">
                  <div className="flex justify-between">
                    <span>Root Emission:</span>
                    <span className="font-mono">{emissionData.displayValues.rootEmission}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ Incoming Streams:</span>
                    <span className="font-mono">{emissionData.displayValues.incomingStreams}</span>
                  </div>
                  {emissionData.streams.incoming.count > 0 && (
                    <div className="text-muted-foreground">
                      From {emissionData.streams.incoming.count} stream{emissionData.streams.incoming.count !== 1 ? 's' : ''}
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span className="font-mono">{emissionData.displayValues.totalWithoutOutgoing}</span>
                  </div>
                </div>
                
                {emissionData.streams.outgoing.tokensPerWeek > 0 && (
                  <div className="space-y-1 rounded-md bg-orange-50 dark:bg-orange-950/20 p-2">
                    <div className="flex justify-between text-orange-700 dark:text-orange-300">
                      <span>Forwarding Out:</span>
                      <span className="font-mono">-{emissionData.displayValues.outgoingStreams}</span>
                    </div>
                    {emissionData.streams.outgoing.count > 0 && (
                      <div className="text-xs text-orange-600 dark:text-orange-400">
                        To {emissionData.streams.outgoing.count} stream{emissionData.streams.outgoing.count !== 1 ? 's' : ''}
                      </div>
                    )}
                    <Separator className="my-1" />
                    <div className="flex justify-between font-medium text-orange-800 dark:text-orange-200">
                      <span>Net Total:</span>
                      <span className="font-mono">{emissionData.displayValues.totalEmission}</span>
                    </div>
                  </div>
                )}

                {typeof penaltyFactor === "number" &&
                  !Number.isNaN(penaltyFactor) &&
                  penaltyFactor < 1 && (
                    <div className="space-y-1 rounded-md bg-red-50 dark:bg-red-950/20 p-2 text-red-700 dark:text-red-300">
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
              : shouldShowTokensPerWeek && emissionData.displayValues.totalWithoutOutgoing
                ? emissionData.displayValues.totalWithoutOutgoing
                : "-"}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-2">
            <p className="text-sm font-medium">Tokens per week (before forwarding)</p>
            <p className="text-xs text-muted-foreground">
              Total tokens this agent receives per week, including root emissions and incoming streams, 
              but before forwarding any outgoing streams.
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

export function EnhancedAgentCardContent({
  shortDescription,
  agentKey,
  percComputedWeight,
  isLoading = false,
  isStatsLoading = false,
  emissionData,
  prePenaltyPercent,
  penaltyFactor,
}: Readonly<EnhancedAgentCardContentProps>) {
  if (isLoading) {
    return (
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <EnhancedAgentStats
            agentKey={agentKey}
            percComputedWeight={percComputedWeight}
            isLoading={isStatsLoading}
            emissionData={emissionData}
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