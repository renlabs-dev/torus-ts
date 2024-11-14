import { match } from "rustie";

import type { ProposalStatus } from "@torus-ts/subspace/old";
import { Badge } from "@torus-ts/ui";

interface StatusLabelProps {
  status: ProposalStatus;
}

export function StatusLabel(props: StatusLabelProps): JSX.Element {
  const { status } = props;

  return match(status)({
    open() {
      return (
        <Badge
          variant="solid"
          className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/10"
        >
          Active
        </Badge>
      );
    },
    accepted() {
      return (
        <Badge
          variant="solid"
          className="bg-green-500/10 text-green-500 hover:bg-green-500/10"
        >
          Accepted
        </Badge>
      );
    },
    expired() {
      return (
        <Badge
          variant="solid"
          className="bg-gray-500/10 text-gray-500 hover:bg-gray-500/10"
        >
          Expired
        </Badge>
      );
    },
    refused() {
      return (
        <Badge
          variant="solid"
          className="bg-red-500/10 text-red-500 hover:bg-red-500/10"
        >
          Refused
        </Badge>
      );
    },
  });
}
