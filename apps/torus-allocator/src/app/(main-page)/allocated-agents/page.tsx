"use client";

import { AgentItemCard } from "../../_components/agent-item-card";
import { useTorus } from "@torus-ts/torus-provider";
import { ViewSelector } from "~/app/_components/view-selector";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

export default function AllocatedAgentsPage() {
  const { selectedAccount } = useTorus();
  const { delegatedAgents } = useDelegateAgentStore();

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
        {/* Add search here */}
        <ViewSelector />
      </div>
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
