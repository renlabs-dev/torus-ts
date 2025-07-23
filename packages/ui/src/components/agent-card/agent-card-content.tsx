"use client";

import { Coins, DollarSign, Globe, Key } from "lucide-react";

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
  usdValue?: string;
  isLoading?: boolean;
  isStatsLoading?: boolean;
}

function AgentStats({
  percComputedWeight,
  tokensPerWeek,
  agentKey,
  usdValue,
  isLoading = false,
}: {
  agentKey: string;
  percComputedWeight?: number | null;
  tokensPerWeek?: string;
  usdValue?: string;
  isLoading?: boolean;
}) {
  const isMobile = useIsMobile();

  const shouldShowTokensPerWeek =
    tokensPerWeek &&
    !tokensPerWeek.startsWith("0.00") &&
    !tokensPerWeek.startsWith("0 ");

  const shouldShowUsdValue =
    usdValue && !usdValue.startsWith("$0.00") && !usdValue.startsWith("$0 ");

  const hasStats =
    ((percComputedWeight !== null && percComputedWeight !== 0) ||
      shouldShowTokensPerWeek) ??
    shouldShowUsdValue;

  if (!hasStats) return null;

  return (
    <div className="relative z-30 flex w-full flex-wrap items-center justify-between gap-3">
      {percComputedWeight !== null && percComputedWeight !== undefined && (
        <HoverCard>
          <HoverCardTrigger>
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Globe size={14} />
              {Math.round(percComputedWeight * 100)}%
            </Label>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <p className="text-sm">Current emission alocated to this agent.</p>
          </HoverCardContent>
        </HoverCard>
      )}

      {shouldShowTokensPerWeek && (
        <HoverCard>
          <HoverCardTrigger>
            <Label className="flex items-center gap-1 text-xs font-semibold">
              <Coins size={16} />
              {isLoading ? "Loading..." : tokensPerWeek}
            </Label>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <p className="text-sm">Tokens per week.</p>
          </HoverCardContent>
        </HoverCard>
      )}

      {shouldShowUsdValue && (
        <Label className="flex items-center gap-1 text-xs font-semibold">
          <DollarSign size={14} />
          {isLoading ? "Loading..." : usdValue}
        </Label>
      )}

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
  usdValue,
  isLoading = false,
  isStatsLoading = false,
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
            usdValue={usdValue}
            isLoading={isStatsLoading}
          />
        </div>
        <Separator />
        <p className="line-clamp-3 break-words text-sm">{shortDescription}</p>
      </div>
    </CardContent>
  );
}
