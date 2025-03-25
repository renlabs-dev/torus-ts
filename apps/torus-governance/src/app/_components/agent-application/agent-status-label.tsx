import type { AgentApplication } from "@torus-ts/subspace";
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
          className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10"
        >
          Active
        </Badge>
      );
    },
    Resolved({ accepted }) {
      return accepted ? (
        <Badge
          variant="solid"
          className="bg-green-500/10 text-green-500 hover:bg-green-500/10"
        >
          Accepted
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
          className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/10"
        >
          Expired
        </Badge>
      );
    },
  });
}
