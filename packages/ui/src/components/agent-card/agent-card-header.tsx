"use client";

import { Award, DollarSign, Globe } from "lucide-react";

import { cn } from "../../lib/utils";
import { Badge } from "../badge";
import { CardHeader } from "../card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";
import { Label } from "../label";
import { SkeletonAgentCardHeader } from "./agent-card-skeleton-loader";
import type { SocialKind } from "./agent-card-socials-info";
import { AgentCardSocialsInfo, buildSocials } from "./agent-card-socials-info";
import { AgentIcon } from "./agent-icon";

export interface AgentCardHeaderProps {
  name: string;
  agentKey: string;
  iconUrl?: string | null;
  socials?: Partial<Record<SocialKind, string>>;
  website?: string;
  isAgentDelegated?: boolean;
  isAgentSelected?: boolean;
  percComputedWeight?: number | null;
  tokensPerWeek?: string;
  usdValue?: string;
  isLoading?: boolean;
  isMetadataLoading?: boolean;
}

function AgentBadge({
  isAgentSelected,
  isAgentDelegated,
}: {
  isAgentSelected?: boolean;
  isAgentDelegated?: boolean;
}) {
  if (!isAgentDelegated && !isAgentSelected) {
    return null;
  }

  return (
    <Badge
      className={cn(
        isAgentSelected
          ? "border-cyan-500 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10"
          : "border-yellow-500 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10",
      )}
    >
      {isAgentSelected ? "Delegated" : "Selected"}
    </Badge>
  );
}

function AgentStats({
  percComputedWeight,
  tokensPerWeek,
  usdValue,
  isLoading = false,
}: {
  percComputedWeight?: number | null;
  tokensPerWeek?: string;
  usdValue?: string;
  isLoading?: boolean;
}) {
  const hasStats =
    ((percComputedWeight !== null && percComputedWeight !== undefined) ||
      tokensPerWeek) ??
    usdValue;

  if (!hasStats) return null;

  return (
    <div className="relative z-30 flex flex-wrap items-center justify-start gap-3">
      {percComputedWeight !== null && percComputedWeight !== undefined && (
        <HoverCard>
          <HoverCardTrigger>
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <Globe size={14} />
              {Math.round(percComputedWeight * 100)}%
            </Label>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <p className="text-sm">Current Network Allocation on this agent.</p>
          </HoverCardContent>
        </HoverCard>
      )}

      {tokensPerWeek && (
        <HoverCard>
          <HoverCardTrigger>
            <Label className="flex items-center gap-1 text-xs font-semibold">
              <Award size={16} />
              {isLoading ? "Loading..." : tokensPerWeek || "0.00 TORUS"}
            </Label>
          </HoverCardTrigger>
          <HoverCardContent className="w-80">
            <p className="text-sm">Tokens per week.</p>
          </HoverCardContent>
        </HoverCard>
      )}

      {usdValue && (
        <Label className="flex items-center gap-1 text-xs font-semibold">
          <DollarSign size={14} />
          {isLoading ? "Loading..." : usdValue || "$0.00"}
        </Label>
      )}
    </div>
  );
}

export function AgentCardHeader({
  name,
  agentKey: _agentKey,
  iconUrl,
  socials = {},
  website,
  isAgentDelegated,
  isAgentSelected,
  percComputedWeight,
  tokensPerWeek,
  usdValue,
  isLoading = false,
  isMetadataLoading = false,
}: AgentCardHeaderProps) {
  const socialsList = buildSocials(socials, website);

  if (isMetadataLoading) return <SkeletonAgentCardHeader />;

  return (
    <CardHeader>
      <div className="flex w-full flex-col items-center gap-6 md:flex-row md:gap-3">
        <AgentIcon icon={iconUrl} alt={`${name} icon`} variant="compact" />
        <div className="mt-1 flex h-full w-full flex-col justify-between gap-3">
          <div className="flex w-full items-center justify-between gap-4">
            <AgentCardSocialsInfo socials={socialsList} />
            <AgentBadge
              isAgentSelected={isAgentSelected}
              isAgentDelegated={isAgentDelegated}
            />
          </div>
          <h2 className="w-fit text-ellipsis text-base font-semibold md:max-w-fit">
            {name}
          </h2>
          <AgentStats
            percComputedWeight={percComputedWeight}
            tokensPerWeek={tokensPerWeek}
            usdValue={usdValue}
            isLoading={isLoading}
          />
        </div>
      </div>
    </CardHeader>
  );
}
