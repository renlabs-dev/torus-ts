import { Badge } from "@torus-ts/ui";

export function AgentActivityLabel(): JSX.Element {
  return (
    <Badge
      variant="solid"
      className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10"
    >
      Agent
    </Badge>
  );
}
