import { Badge } from "@torus-ts/ui/components/badge";

export function AgentActivityLabel() {
  return (
    <Badge
      variant="solid"
      className="bg-violet-500/20 text-violet-500 hover:bg-violet-500/10"
    >
      Whitelisted
    </Badge>
  );
}
