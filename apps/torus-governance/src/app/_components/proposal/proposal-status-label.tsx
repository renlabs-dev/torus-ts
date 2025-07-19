import { match } from "rustie";

import type { ProposalStatus } from "@torus-network/sdk/chain";

import { Badge } from "@torus-ts/ui/components/badge";

interface ProposalStatusLabelProps {
  status: ProposalStatus;
}

export function ProposalStatusLabel(props: ProposalStatusLabelProps) {
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
    Accepted() {
      return (
        <Badge
          variant="solid"
          className="bg-green-500/20 text-green-500 hover:bg-green-500/10"
        >
          Approved
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
    Refused() {
      return (
        <Badge
          variant="solid"
          className="bg-red-600/20 text-red-600 hover:bg-red-600/10"
        >
          Refused
        </Badge>
      );
    },
  });
}
