"use client";

import Link from "next/link";

import { Card } from "../card";
import { AgentCardContent, type AccountEmissionData } from "./agent-card-content";
import { AgentCardFooter } from "./agent-card-footer";
import { AgentCardHeader } from "./agent-card-header";
import { CardHoverEffect } from "./agent-card-hover-effect";
import type { SocialKind } from "./agent-card-socials-info";

export interface AgentCardProps {
  id?: number;
  name: string;
  agentKey: string;
  iconUrl?: string | null;
  shortDescription?: string;
  socials?: Partial<Record<SocialKind, string>>;
  website?: string;
  percComputedWeight?: number | null;
  // Optional: provide pre-penalty and penalty to show tooltip details
  prePenaltyPercent?: number | null;
  penaltyFactor?: number | null;
  href?: string;
  showHoverEffect?: boolean;
  isAgentDelegated?: boolean;
  isAgentSelected?: boolean;
  tokensPerWeek?: string;
  currentPercentage?: number;
  onPercentageChange?: (value: number) => void;
  isAccountConnected?: boolean;
  isLoading?: boolean;
  isMetadataLoading?: boolean;
  footerContent?: React.ReactNode;
  userWeightPower?: string | bigint | null;
  // Enhanced emission data
  emissionData?: AccountEmissionData;
}

export function AgentCard(props: Readonly<AgentCardProps>) {
  const {
    name,
    agentKey,
    iconUrl,
    shortDescription,
    socials,
    website,
    percComputedWeight,
    prePenaltyPercent,
    penaltyFactor,
    href,
    showHoverEffect = true,
    isAgentDelegated,
    isAgentSelected,
    tokensPerWeek,
    currentPercentage,
    onPercentageChange,
    isAccountConnected,
    isLoading = false,
    isMetadataLoading = false,
    footerContent,
    userWeightPower,
    emissionData,
  } = props;

  const cardContent = (
    <>
      {showHoverEffect && <CardHoverEffect />}

      <AgentCardHeader
        name={name}
        agentKey={agentKey}
        iconUrl={iconUrl}
        socials={socials}
        website={website}
        isAgentDelegated={isAgentDelegated}
        isAgentSelected={isAgentSelected}
        isMetadataLoading={isMetadataLoading}
      />

      <AgentCardContent
        shortDescription={shortDescription}
        agentKey={agentKey}
        percComputedWeight={percComputedWeight}
        prePenaltyPercent={prePenaltyPercent}
        penaltyFactor={penaltyFactor}
        tokensPerWeek={tokensPerWeek}
        isLoading={isMetadataLoading}
        isStatsLoading={isLoading}
        emissionData={emissionData}
      />

      <div className="mt-auto">
        <AgentCardFooter
          currentPercentage={currentPercentage}
          onPercentageChange={onPercentageChange}
          isAccountConnected={isAccountConnected}
          isLoading={isLoading}
          userWeightPower={userWeightPower}
        >
          {footerContent}
        </AgentCardFooter>
      </div>
    </>
  );

  const cardClassName = `group relative flex flex-col border bg-gradient-to-tr from-zinc-900 to-background transition duration-300 ${showHoverEffect ? "hover:scale-[102%] hover:border-white hover:shadow-2xl" : ""}`;

  if (href) {
    return (
      <Card className={cardClassName}>
        {cardContent}
        <Link href={href} className="absolute inset-0">
          <span className="sr-only">Click to view agent details</span>
        </Link>
      </Card>
    );
  }

  return <Card className={cardClassName}>{cardContent}</Card>;
}
