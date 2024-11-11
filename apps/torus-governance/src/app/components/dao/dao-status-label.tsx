import type { DaoApplicationStatus } from "@torus-ts/types";
import { Badge } from "@torus-ts/ui";

interface StatusLabelProps {
  status: DaoApplicationStatus;
}

export const DaoStatusLabel = (props: StatusLabelProps): JSX.Element => {
  const { status } = props;
  const votingStatus = {
    Pending: (
      <Badge className="text-yellow-500 border-none bg-yellow-500/10">
        Active
      </Badge>
    ),
    Accepted: (
      <Badge className="text-green-500 border-none bg-green-500/10">
        Accepted
      </Badge>
    ),
    Refused: (
      <Badge className="text-red-500 border-none bg-red-500/10">
        Refused
      </Badge>
    ),
    Removed: (
      <Badge className="border-none bg-rose-500/10 text-rose-500 ">
        Removed
      </Badge>
    ),
  };
  return votingStatus[status];
};
