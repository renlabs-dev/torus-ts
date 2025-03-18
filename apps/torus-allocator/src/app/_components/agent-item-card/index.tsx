import { AgentCardContent } from "./components/agent-card-content";
import { AgentCardFooter } from "./components/agent-card-footer";
import { AgentCardHeader } from "./components/agent-card-header";
import { CardHoverEffect } from "./components/card-hover-effect";
import { Card } from "@torus-ts/ui/components/card";
import Link from "next/link";
import { api } from "~/trpc/server";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
}
export async function AgentItemCard(props: Readonly<AgentCardProps>) {
  const computedAgentWeight = await api.computedAgentWeight.byAgentKey({
    agentKey: props.agentKey,
  });

  return (
    <Card className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition duration-300 hover:scale-[102%] hover:border-white hover:shadow-2xl">
      <CardHoverEffect />

      <AgentCardHeader
        {...props}
        networkAllocation={computedAgentWeight?.percComputedWeight}
      />
      <AgentCardContent metadataUri={props.metadataUri} />
      <AgentCardFooter {...props} />

      <Link href={`agent/${props.agentKey}`} className="absolute inset-0">
        <span className="sr-only">Click to view agent details</span>
      </Link>
    </Card>
  );
}
