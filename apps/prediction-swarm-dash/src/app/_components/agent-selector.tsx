"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { cn } from "@torus-ts/ui/lib/utils";
import { useAgentContributionStatsQuery } from "~/hooks/api/use-agent-contribution-stats-query";
import { useAgentDetailedMetrics } from "~/hooks/api/use-agent-detailed-metrics-query";
import { useAgentName } from "~/hooks/api/use-agent-name-query";
import type { TimeWindowParams } from "~/lib/api-schemas";
import { formatAddress } from "~/lib/api-utils";
import { Check, ChevronsUpDown, User } from "lucide-react";
import { useMemo, useState } from "react";
import { LoadingDots } from "./loading-dots";

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
      className="flex cursor-pointer items-center justify-between"
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

      <div className="text-muted-foreground flex items-center gap-3">
        <span title="Predictions">{totalPredictions}P</span>
        <span title="Claims">{totalVerificationClaims}C</span>
        <span title="Verdicts">{totalVerificationVerdicts}V</span>
      </div>
    </CommandItem>
  );
}

function SelectedAgentDisplay({ address }: { address: string }) {
  const { agentName } = useAgentName(address);
  return <span className="truncate">{agentName}</span>;
}

interface AgentSelectorProps {
  value?: string;
  onValueChange: (address: string) => void;
  placeholder?: string;
  className?: string;
  excludeAgents?: string[];
  timeWindow?: TimeWindowParams;
}

export function AgentSelector({
  value,
  onValueChange,
  placeholder = "Select agent...",
  className,
  excludeAgents = [],
  timeWindow,
}: AgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Get all agents from contribution stats
  const { data: statsData, isLoading: statsLoading } =
    useAgentContributionStatsQuery();

  // Process agents list (without names for now)
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
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
      .sort((a, b) => b.predictions - a.predictions); // Sort by activity
  }, [statsData, excludeAgents]);

  const isLoading = statsLoading;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className,
          )}
          disabled={isLoading}
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            {isLoading ? (
              <LoadingDots size="sm" />
            ) : value ? (
              <SelectedAgentDisplay address={value} />
            ) : (
              placeholder
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-full bg-transparent p-0">
        <Command>
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
                    isSelected={value === agent.address}
                    searchTerm={search}
                    timeWindow={timeWindow}
                    onSelect={() => {
                      onValueChange(
                        agent.address === value ? "" : agent.address,
                      );
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
