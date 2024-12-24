"use client";

import { useTorus } from "@torus-ts/torus-provider";

import { AgentCard } from "~/app/components/agent-card";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

export default function Page() {
  const { selectedAccount } = useTorus();
  const { delegatedAgents } = useDelegateAgentStore();

  if (!selectedAccount?.address)
    return (
      <span className="w-full items-center justify-start pt-12 text-center text-lg">
        Connect Wallet to view your weighted modules.
      </span>
    );

  const weightedModules = delegatedAgents.filter(
    (module) => module.percentage > 0,
  );

  return (
    <div className="h-full min-h-[calc(100vh-169px)] w-full">
      {weightedModules.length ? (
        <div className="mb-16 grid h-full w-full animate-fade-up grid-cols-1 gap-4 backdrop-blur-md animate-delay-700 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {weightedModules.map((module) => (
            <AgentCard
              id={module.id}
              key={module.id}
              name={module.name}
              percentage={module.percentage}
              agentKey={module.address}
            />
          ))}
        </div>
      ) : (
        <span className="w-full items-center justify-start pt-12 text-center text-lg">
          <p>No weighted modules found</p>.
        </span>
      )}
    </div>
  );
}
