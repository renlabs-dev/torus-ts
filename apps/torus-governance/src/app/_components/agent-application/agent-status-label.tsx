import type { AgentApplication } from "@torus-network/sdk";
import { Badge } from "@torus-ts/ui/components/badge";
import { match } from "rustie";

interface StatusLabelProps {
  status: AgentApplication["status"];
}

export function AgentStatusLabel(props: StatusLabelProps) {
  const { status } = props;

  return match(status)({
    Open() {
      return (
        <Badge
          variant="solid"
          className="bg-zinc-600 text-white hover:bg-zinc-700/80"
        >
          Open
        </Badge>
      );
    },
    Resolved({ accepted }) {
      return accepted ? (
        <Badge
          variant="solid"
          className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10"
        >
          Whitelisted
        </Badge>
      ) : (
        <Badge
          variant="solid"
          className="bg-red-500/10 text-red-500 hover:bg-red-500/10"
        >
          Refused
        </Badge>
      );
    },
    Expired() {
      return (
        <Badge
          variant="solid"
          className="bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/10"
        >
          Expired
        </Badge>
      );
    },
  });
}
