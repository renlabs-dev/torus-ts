import { AgentItemCard } from "../_components/agent-item-card";
import { api } from "~/trpc/server";

export default async function Page() {
  const agents = await api.agent.all();

  return (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
      {agents.length === 0 ? <p>No agents found.</p> : null}
      {agents.map((agent) => (
        <AgentItemCard
          id={agent.id}
          key={agent.id}
          name={agent.name ?? "<MISSING_NAME>"}
          agentKey={agent.key}
          metadataUri={agent.metadataUri}
          registrationBlock={agent.registrationBlock}
        />
      ))}
    </div>
  );
}
