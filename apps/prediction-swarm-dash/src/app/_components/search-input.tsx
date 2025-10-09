"use client";

import { Check, SearchIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { LoadingDots } from "@/components/ui/loading-dots";
import { useAgentContributionStatsQuery } from "@/hooks/api/use-agent-contribution-stats-query";
import { useAgentDetailedMetrics } from "@/hooks/api/use-agent-detailed-metrics-query";
import { useAgentName } from "@/hooks/api/use-agent-name-query";
import { useIsMobile } from "@/hooks/use-mobile";
import type { TimeWindowParams } from "@/lib/api-schemas";
import { formatAddress } from "@/lib/api-utils";
import { cn } from "@/lib/utils";
import { BorderContainer } from "./border-container";
import Silk from "./silk-animation";

interface AgentItemProps {
  address: string;
  isSelected: boolean;
  onSelect: () => void;
  searchTerm: string;
  timeWindow?: TimeWindowParams;
}

function AgentItem({
  address,
  isSelected,
  onSelect,
  searchTerm,
  timeWindow,
}: AgentItemProps) {
  const { agentName } = useAgentName(address);

  const {
    totalPredictions,
    totalVerificationClaims,
    totalVerificationVerdicts,
  } = useAgentDetailedMetrics(address, timeWindow);

  const matchesSearch =
    !searchTerm ||
    agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    address.toLowerCase().includes(searchTerm.toLowerCase());

  if (!matchesSearch) return null;

  return (
    <CommandItem
      key={address}
      value={address}
      onSelect={onSelect}
      className="flex items-center justify-between cursor-pointer"
      data-predictions={totalPredictions}
      data-claims={totalVerificationClaims}
      data-verdicts={totalVerificationVerdicts}
    >
      <div className="flex items-center gap-2">
        <Check
          className={cn("h-4 w-4", isSelected ? "opacity-100" : "opacity-0")}
        />
        <div className="flex flex-col">
          <span>{agentName}</span>
          <span className="text-muted-foreground">
            {formatAddress(address)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 text-muted-foreground">
        <span title="Predictions">{totalPredictions}P</span>
        <span title="Claims">{totalVerificationClaims}C</span>
        <span title="Verdicts">{totalVerificationVerdicts}V</span>
      </div>
    </CommandItem>
  );
}

interface SearchInputProps {
  onValueChange?: (address: string) => void;
  placeholder?: string;
  excludeAgents?: string[];
  timeWindow?: TimeWindowParams;
}

export function SearchInput({
  onValueChange,
  placeholder = "Search for any agent in the swarm...",
  excludeAgents = [],
  timeWindow,
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isMobile = useIsMobile();

  const [showCommand, setShowCommand] = useState(false);
  const [search, setSearch] = useState("");

  // Get all agents from contribution stats
  const { data: statsData, isLoading: statsLoading } =
    useAgentContributionStatsQuery();

  // Process agents list
  const agents = useMemo(() => {
    if (!statsData?.agent_contribution_stats) return [];

    return statsData.agent_contribution_stats
      .map((agent) => ({
        address: agent.wallet_address,
        predictions: agent.num_predictions_submitted,
        claims: agent.num_verification_claims_submitted,
        verdicts: agent.num_verification_verdicts_submitted,
      }))
      .filter((agent) => !excludeAgents.includes(agent.address))
      .sort((a, b) => b.predictions - a.predictions);
  }, [statsData, excludeAgents]);

  const isLoading = statsLoading;

  const handleInputClick = () => {
    setShowCommand(true);
  };

  const handleAskSwarmClick = () => {
    setShowCommand(true);
  };

  const [selectedAgent, setSelectedAgent] = React.useState<string>(
    pathname === "/agents" ? searchParams.get("agent") || "" : ""
  );

  const handleAgentChange = useCallback(
    (agentAddress: string) => {
      setSelectedAgent(agentAddress);

      if (agentAddress) {
        router.push(`/agents?agent=${encodeURIComponent(agentAddress)}`, {
          scroll: false,
        });
      } else {
        router.push("/agents", { scroll: false });
      }
    },
    [router]
  );

  const { agentName } = useAgentName(selectedAgent);

  React.useEffect(() => {
    if (pathname !== "/agents") {
      setSelectedAgent("");
    } else {
      const agentParam = searchParams.get("agent");
      if (agentParam !== selectedAgent) {
        setSelectedAgent(agentParam || "");
      }
    }
  }, [pathname, searchParams, selectedAgent]);

  const effectivePlaceholder = useMemo(() => {
    if (selectedAgent && agentName) {
      return `Selected Agent: ${agentName}`;
    }
    return isMobile ? "Search accounts or tickers..." : placeholder;
  }, [selectedAgent, agentName, placeholder, isMobile]);

  return (
    <>
      <CommandDialog open={showCommand} onOpenChange={setShowCommand}>
        <CommandInput
          placeholder="Search agents..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty className="py-6 text-center">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <LoadingDots size="sm" />
                <span>Loading agents...</span>
              </div>
            ) : (
              "No agents found."
            )}
          </CommandEmpty>

          {!isLoading && (
            <CommandGroup>
              {agents.map((agent) => (
                <AgentItem
                  key={agent.address}
                  address={agent.address}
                  isSelected={selectedAgent === agent.address}
                  searchTerm={search}
                  timeWindow={timeWindow}
                  onSelect={() => {
                    const newValue =
                      agent.address === selectedAgent ? "" : agent.address;
                    handleAgentChange(newValue);
                    if (onValueChange) {
                      onValueChange(newValue);
                    }
                    setShowCommand(false);
                    setSearch("");
                  }}
                />
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      <BorderContainer>
        <div className="relative flex-1 flex justify-center items-center px-[8%] md:px-0">
          <div className="relative w-full border-x border-border sm:border-none">
            <SearchIcon className="absolute left-4 sm:left-8 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              type="search"
              id="search"
              placeholder={effectivePlaceholder}
              value=""
              className="h-18 rounded-none pl-12 sm:pl-18 cursor-pointer border-none w-full"
              onClick={handleInputClick}
              readOnly
            />
          </div>
        </div>
        <Button
          type="submit"
          className="hidden md:flex h-18 rounded-none bg-transparent hover:bg-transparent text-white relative overflow-hidden px-16 cursor-pointer border-l border-border"
          onClick={handleAskSwarmClick}
        >
          <span className="relative z-10 tracking-[0.60em] font-extralight text-base pointer-events-none">
            ASK TORUS
          </span>
          <div className="absolute inset-0 opacity-30 hover:opacity-50 transition duration-200">
            <Silk scale={0.5} speed={4} noiseIntensity={0} />
          </div>
        </Button>
      </BorderContainer>
    </>
  );
}
