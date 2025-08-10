"use client";

import { Coins, Globe, Key } from "lucide-react";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";

import { CardContent } from "../card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { Label } from "../label";
import { Separator } from "../separator";
import { SkeletonAgentCardContent } from "./agent-card-skeleton-loader";

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
}

function AgentStats({
  percComputedWeight,
  tokensPerWeek,
  agentKey,
  isLoading = false,
  prePenaltyPercent,
  penaltyFactor,
}: {
  agentKey: string;
  percComputedWeight?: number | null;
  tokensPerWeek?: string;
  usdValue?: string;
  isLoading?: boolean;
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
}) {
  const isMobile = useIsMobile();

  const shouldShowTokensPerWeek =
    tokensPerWeek &&
    !tokensPerWeek.startsWith("0.00") &&
    !tokensPerWeek.startsWith("0 ");

  // Always show stats section to display address and other info
  // Individual stats will show "-" for missing values

  return (
    <div className="relative z-30 flex w-full flex-wrap items-center justify-between gap-3">
      <HoverCard>
        <HoverCardTrigger>
          <Label className="flex items-center gap-1.5 text-xs font-semibold">
            <Globe size={14} />
            {typeof percComputedWeight === "number"
              ? `${(percComputedWeight * 100).toFixed(2)}%`
              : "-"}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
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
        </HoverCardContent>
      </HoverCard>

      <HoverCard>
        <HoverCardTrigger>
          <Label className="flex items-center gap-1 text-xs font-semibold">
            <Coins size={16} />
            {isLoading
              ? "Loading..."
              : shouldShowTokensPerWeek
                ? tokensPerWeek
                : "-"}
          </Label>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <p className="text-sm">Tokens per week.</p>
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
          />
        </div>
        <Separator />
        <p className="line-clamp-3 break-words text-sm">{shortDescription}</p>
      </div>
    </CardContent>
  );
}
