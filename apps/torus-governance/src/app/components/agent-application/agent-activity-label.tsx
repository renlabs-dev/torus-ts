import { Badge } from "@torus-ts/ui";

export function AgentActivityLabel(): JSX.Element {
  return (
    <Badge
      variant="solid"
      className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10"
    >
      Agent
    </Badge>
  );
}
