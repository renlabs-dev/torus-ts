import { Label } from "@torus-ts/ui/components/label";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";

export function SelectedAgentsLabel() {
  const { delegatedAgents } = useDelegateAgentStore();
  return (
    <Label className="hidden items-center gap-2 text-sm md:flex">
      <span className="text-muted-foreground text-nowrap">
        Selected Agents:
      </span>
      <span>{delegatedAgents.length}</span>
    </Label>
  );
}
