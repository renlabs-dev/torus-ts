"use client";

import { X } from "lucide-react";
import React from "react";
import { AgentSelector } from "@/components/agent-selector";
import type { DateRangeFilterData } from "@/components/date-range-filter";
import { DateRangeFilter } from "@/components/date-range-filter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAgentName } from "@/hooks/api/use-agent-name-query";
import { useIsMobile } from "@/hooks/use-mobile";

interface SearchFilters {
  from?: Date;
  to?: Date;
  limit: number;
  offset: number;
}

interface ComparisonSelectorProps {
  selectedAgents: string[];
  onAddAgent: (agentAddress: string) => void;
  onRemoveAgent: (agentAddress: string) => void;
  searchFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

interface AgentChipProps {
  address: string;
  onRemove: () => void;
}

function AgentChip({ address, onRemove }: AgentChipProps) {
  const { agentName } = useAgentName(address);

  return (
    <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-md">
      <span className="text-foreground">{agentName}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-4 w-4 p-0 hover:cursor-pointer"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function ComparisonSelector({
  selectedAgents,
  onAddAgent,
  onRemoveAgent,
  searchFilters,
  onFiltersChange,
}: ComparisonSelectorProps) {
  const [newAgent, setNewAgent] = React.useState("");

  const handleAgentSelect = (agentAddress: string) => {
    if (
      agentAddress &&
      !selectedAgents.includes(agentAddress) &&
      selectedAgents.length < 4
    ) {
      onAddAgent(agentAddress);
      setNewAgent("");
    }
  };

  const isMobile = useIsMobile();

  return (
    <Card className="mb-6">
      <CardContent className="space-y-4">
        {/* Add New Agent */}
        {selectedAgents.length < 4 && (
          <div>
            <label
              htmlFor="new-agent-selector"
              className="font-medium text-foreground mb-2 block"
            >
              Add agent
            </label>
            <AgentSelector
              value={newAgent}
              onValueChange={handleAgentSelect}
              placeholder={
                isMobile
                  ? "Search agents..."
                  : "Search and select an agent to add..."
              }
              className="w-full"
              excludeAgents={selectedAgents}
            />
          </div>
        )}

        {/* Selected Agents */}
        {selectedAgents.length > 0 && (
          <div className="space-y-2">
            <div className="font-medium text-foreground">
              Selected agents ({selectedAgents.length}/4)
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedAgents.map((agent) => (
                <AgentChip
                  key={agent}
                  address={agent}
                  onRemove={() => onRemoveAgent(agent)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Date Range Filter - Always Visible */}
        {selectedAgents.length > 0 && (
          <div className="pt-4">
            <DateRangeFilter
              onSubmit={(data: DateRangeFilterData) => {
                onFiltersChange({
                  from: data.from,
                  to: data.to,
                  limit: data.limit || 10,
                  offset: 0,
                });
              }}
              defaultValues={{
                from: searchFilters.from,
                to: searchFilters.to,
                limit: searchFilters.limit,
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
