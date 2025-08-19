"use client";

import Link from "next/link";

import { Card } from "../card";
import { AgentCardContent } from "./agent-card-content";
import { AgentCardFooter } from "./agent-card-footer";
import { AgentCardHeader } from "./agent-card-header";
import { CardHoverEffect } from "./agent-card-hover-effect";
import type { SocialKind } from "./agent-card-socials-info";

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
  emissionData?: AccountEmissionData;
  currentPercentage?: number;
  onPercentageChange?: (value: number) => void;
  isAccountConnected?: boolean;
  isLoading?: boolean;
  isMetadataLoading?: boolean;
  footerContent?: React.ReactNode;
  userWeightPower?: string | bigint | null;
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
    emissionData,
    currentPercentage,
    onPercentageChange,
    isAccountConnected,
    isLoading = false,
    isMetadataLoading = false,
    footerContent,
    userWeightPower,
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
        emissionData={emissionData}
        isLoading={isMetadataLoading}
        isStatsLoading={isLoading}
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
