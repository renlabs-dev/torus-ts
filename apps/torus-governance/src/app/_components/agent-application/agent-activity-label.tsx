import { Badge } from "@torus-ts/ui/components/badge";

export function AgentActivityLabel() {
  return (
    <Badge
      variant="solid"
      className="bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/10"
    >
      Agent
    </Badge>
  );
}
