import { match } from "rustie";

import type { ProposalStatus } from "@torus-ts/types";
import { Badge } from "@torus-ts/ui";

interface StatusLabelProps {
  result: ProposalStatus;
}

export function StatusLabel(props: StatusLabelProps): JSX.Element {
  const { result } = props;

  return match(result)({
    open() {
      return (
        <Badge className="border-yellow-500 bg-yellow-500/10 text-yellow-500">
          Active
        </Badge>
      );
    },
    accepted() {
      return (
        <Badge className="border-green-500 bg-green-500/10 text-green-500">
          Accepted
        </Badge>
      );
    },
    expired() {
      return (
        <Badge className="border-gray-500 bg-gray-500/10 text-gray-500">
          Expired
        </Badge>
      );
    },
    refused() {
      return (
        <Badge className="border-red-500 bg-red-500/10 text-red-500">
          Refused
        </Badge>
      );
    },
  });
}
