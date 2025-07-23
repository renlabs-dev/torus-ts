"use client";

import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

import { AgentCard } from "../../_components/agent-card";
import { Filter } from "../../_components/filter-content";
import { ViewSelector } from "../../_components/view-selector";

export default function AllocatedAgentsPage() {
  const { delegatedAgents } = useDelegateAgentStore();

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex w-full flex-col-reverse items-center justify-between gap-4 md:flex-row">
        <Filter />
        <ViewSelector />
      </div>

      {delegatedAgents.length === 0 ? (
        <div className="flex min-h-[200px] w-full items-center justify-center">
          <p className="text-gray-400">
            You haven't allocated to any agents yet
          </p>
        </div>
      ) : (
        <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {delegatedAgents.map((agent) => (
            <AgentCard
              id={agent.id}
              key={agent.id}
              name={agent.name}
              agentKey={agent.address}
              metadataUri={agent.metadataUri}
              registrationBlock={agent.registrationBlock}
              percComputedWeight={agent.percComputedWeight}
              weightFactor={agent.weightFactor}
              isWhitelisted={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
