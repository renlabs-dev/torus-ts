"use client";

import { AgentItemCard } from "../../_components/agent-item-card";
import { Filter } from "../../_components/filter-content";
import { useTorus } from "@torus-ts/torus-provider";
import { useState, useCallback, useMemo } from "react";
import { ViewSelector } from "~/app/_components/view-selector";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

export default function AllocatedAgentsPage() {
  const { selectedAccount } = useTorus();
  const { delegatedAgents } = useDelegateAgentStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return delegatedAgents;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return delegatedAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(lowerCaseQuery) ||
        agent.address.toLowerCase().includes(lowerCaseQuery),
    );
  }, [delegatedAgents, searchQuery]);

  if (delegatedAgents.length === 0) {
    return (
      <div className="flex min-h-[300px] w-full items-center justify-center">
        <p className="text-gray-400">
          {selectedAccount
            ? "You haven't allocated to any agents yet"
            : "Connect your wallet to see your allocated agents"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full items-center justify-between gap-4">
        <Filter isClientSide={true} onClientSearch={handleSearch} />
        <ViewSelector />
      </div>

      {filteredAgents.length === 0 ? (
        <div className="flex min-h-[200px] w-full items-center justify-center">
          <p className="text-gray-400">No agents match your search</p>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentItemCard
              id={agent.id}
              key={agent.id}
              name={agent.name}
              agentKey={agent.address}
              metadataUri={agent.metadataUri}
              registrationBlock={agent.registrationBlock}
              globalWeightPerc={2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
