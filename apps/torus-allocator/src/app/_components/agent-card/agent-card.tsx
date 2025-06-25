import { Card } from "@torus-ts/ui/components/card";
import Link from "next/link";
import { AgentCardContent } from "./agent-card-content";
import { AgentCardFooter } from "./agent-card-footer";
import { AgentCardHeader } from "./agent-card-header";
import { CardHoverEffect } from "./agent-card-hover-effect";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
  percComputedWeight: number | null;
  weightFactor: number | null;
}

export function AgentCard(props: Readonly<AgentCardProps>) {
  return (
    <Card
      className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition
        duration-300 hover:scale-[102%] hover:border-white hover:shadow-2xl"
    >
      <CardHoverEffect />

      <AgentCardHeader {...props} metadataUri={props.metadataUri ?? ""} />
      <AgentCardContent metadataUri={props.metadataUri ?? ""} />
      <AgentCardFooter {...props} />

      <Link href={`agent/${props.agentKey}`} className="absolute inset-0">
        <span className="sr-only">Click to view agent details</span>
      </Link>
    </Card>
  );
}
