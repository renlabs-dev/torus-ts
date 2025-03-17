import { AgentItemCard } from "../_components/agent-item-card";
import { api } from "~/trpc/server";

async function FetchAgentItemCards() {
  const agents = await api.agent.all();

  return (
    <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
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

export default function Page() {
  return <FetchAgentItemCards />;
}
