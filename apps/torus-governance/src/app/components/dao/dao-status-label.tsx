import type { DaoApplicationStatus } from "@torus-ts/types";
import { Badge } from "@torus-ts/ui";

interface StatusLabelProps {
  daoStatus: DaoApplicationStatus;
}

export const DaoStatusLabel = (props: StatusLabelProps): JSX.Element => {
  const { daoStatus } = props;
  const votingStatus = {
    Pending: (
      <Badge className="border-yellow-500 bg-yellow-500/10 text-yellow-500">
        Active
      </Badge>
    ),
    Accepted: (
      <Badge className="border-green-500 bg-green-500/10 text-green-500">
        Accepted
      </Badge>
    ),
    Refused: (
      <Badge className="border-red-500 bg-red-500/10 text-red-500">
        Refused
      </Badge>
    ),
    Removed: (
      <Badge className="border-rose-500 bg-rose-500/10 text-rose-500">
        Removed
      </Badge>
    ),
  };
  return votingStatus[daoStatus];
};
