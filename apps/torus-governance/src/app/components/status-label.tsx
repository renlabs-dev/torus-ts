import { match } from "rustie";

import type { ProposalStatus } from "@torus-ts/types";
import { Badge } from "@torus-ts/ui";

interface StatusLabelProps {
  status: ProposalStatus;
}

export function StatusLabel(props: StatusLabelProps): JSX.Element {
  const { status } = props;

  return match(status)({
    open() {
      return (
        <Badge variant="solid" className="text-yellow-500 bg-yellow-500/10 hover:bg-yellow-500/10">
          Active
        </Badge>
      );
    },
    accepted() {
      return (
        <Badge variant="solid" className="text-green-500 bg-green-500/10 hover:bg-green-500/10">
          Accepted
        </Badge>
      );
    },
    expired() {
      return (
        <Badge variant="solid" className="text-gray-500 bg-gray-500/10 hover:bg-gray-500/10">
          Expired
        </Badge>
      );
    },
    refused() {
      return (
        <Badge variant="solid" className="text-red-500 bg-red-500/10 hover:bg-red-500/10">
          Refused
        </Badge>
      );
    },
  });
}
