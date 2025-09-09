"use client";

import { Badge } from "../badge";
import { CardHeader } from "../card";
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
  isWhitelisted?: boolean;
  isMetadataLoading?: boolean;
}

function AgentBadge({
  isAgentSelected,
  isAgentDelegated,
}: {
  isAgentSelected?: boolean;
  isAgentDelegated?: boolean;
}) {
  const badges = [];

  // Show Selected/Delegated status badge (mutually exclusive)
  if (isAgentSelected) {
    badges.push(
      <Badge
        key="delegated"
        className="border-cyan-500 bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10"
      >
        Delegated
      </Badge>,
    );
  } else if (isAgentDelegated) {
    badges.push(
      <Badge
        key="selected"
        className="border-yellow-500 bg-yellow-500/10 text-xs text-yellow-500 hover:bg-yellow-500/10"
      >
        Selected
      </Badge>,
    );
  }

  if (badges.length === 0) return null;

  return <div className="flex gap-0.5">{badges}</div>;
}

export function AgentCardHeader({
  name,
  agentKey: _agentKey,
  iconUrl,
  socials = {},
  website,
  isAgentDelegated,
  isAgentSelected,
  isWhitelisted,
  isMetadataLoading = false,
}: AgentCardHeaderProps) {
  const socialsList = buildSocials(socials, website);

  if (isMetadataLoading) return <SkeletonAgentCardHeader />;

  return (
    <CardHeader>
      <div className="flex w-full flex-col items-center gap-6 md:flex-row md:items-stretch md:gap-3">
        <div className="relative">
          <AgentIcon icon={iconUrl} alt={`${name} icon`} variant="compact" />
          {isWhitelisted && (
            <Badge className="absolute -left-3 -top-3">Root</Badge>
          )}
        </div>
        <div className="flex w-full flex-col gap-3 md:relative md:min-h-[60px] md:flex-1 md:gap-0">
          <h2 className="text-center text-base font-semibold md:absolute md:inset-0 md:flex md:items-center md:text-left">
            {name}
          </h2>
          <div className="flex w-full items-center justify-between gap-1 md:absolute md:inset-x-0 md:top-0">
            <AgentCardSocialsInfo socials={socialsList} />
            <AgentBadge
              isAgentSelected={isAgentSelected}
              isAgentDelegated={isAgentDelegated}
            />
          </div>
        </div>
      </div>
    </CardHeader>
  );
}
