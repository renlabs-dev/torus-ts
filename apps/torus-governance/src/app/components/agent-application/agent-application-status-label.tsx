import { Badge } from "@torus-ts/ui";

interface StatusLabelProps {
  status: "Pending" | "Accepted" | "Refused" | "Removed";
}

export const DaoStatusLabel = (props: StatusLabelProps): JSX.Element => {
  const { status } = props;
  const votingStatus = {
    Pending: (
      <Badge className="border-none bg-yellow-500/10 text-yellow-500">
        Active
      </Badge>
    ),
    Accepted: (
      <Badge className="border-none bg-green-500/10 text-green-500">
        Accepted
      </Badge>
    ),
    Refused: (
      <Badge className="border-none bg-red-500/10 text-red-500">Refused</Badge>
    ),
    Removed: (
      <Badge className="border-none bg-rose-500/10 text-rose-500">
        Removed
      </Badge>
    ),
  };
  return votingStatus[status];
};
