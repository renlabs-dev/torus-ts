import { AgentCardContent } from "./components/agent-card-content";
import { AgentCardFooter } from "./components/agent-card-footer";
import { AgentCardHeader } from "./components/agent-card-header";
import { CardHoverEffect } from "./components/card-hover-effect";
import { Card } from "@torus-ts/ui/components/card";
import Link from "next/link";

interface AgentCardProps {
  id: number;
  name: string;
  agentKey: string;
  metadataUri: string | null;
  registrationBlock: number | null;
  globalWeightPerc: number | null;
}

export function AgentItemCard(props: Readonly<AgentCardProps>) {
  return (
    <Card className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition duration-300 hover:scale-[102%] hover:border-white hover:shadow-2xl">
      <CardHoverEffect />

      <AgentCardHeader {...props} globalWeightPerc={props.globalWeightPerc} />
      <AgentCardContent metadataUri={props.metadataUri} />
      <AgentCardFooter {...props} />

      <Link href={`agent/${props.agentKey}`} className="absolute inset-0">
        <span className="sr-only">Click to view agent details</span>
      </Link>
    </Card>
  );
}
