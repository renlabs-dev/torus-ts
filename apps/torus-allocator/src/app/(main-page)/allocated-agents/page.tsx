"use client";

import { AgentItemCard } from "../../_components/agent-item-card";
import { useTorus } from "@torus-ts/torus-provider";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

export default function AllocatedAgentsPage() {
  const { selectedAccount } = useTorus();
  const { delegatedAgents } = useDelegateAgentStore();

  return (
    <div className="flex w-full flex-col">
      <h1 className="mb-6 text-2xl font-bold">My Allocated Agents</h1>

      {delegatedAgents.length === 0 && (
        <div className="flex min-h-[300px] w-full items-center justify-center">
          <p className="text-gray-400">
            {selectedAccount
              ? "You haven't allocated to any agents yet"
              : "Connect your wallet to see your allocated agents"}
          </p>
        </div>
      )}

      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        {delegatedAgents.map((agent) => (
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
    </div>
  );
}
