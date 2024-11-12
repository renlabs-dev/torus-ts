import { Badge } from "@torus-ts/ui";

export type VoteStatus = "APPROVED" | "REFUSED" | "UNVOTED";

interface VoteLabelProps {
  vote: VoteStatus;
}

export function VoteLabel(props: VoteLabelProps): JSX.Element {
  const { vote } = props;

  const votingStatus = {
    UNVOTED: <></>,
    APPROVED: (
      <Badge variant="solid" className="bg-green-500/10 text-green-500">
        Approved
      </Badge>
    ),
    REFUSED: (
      <Badge variant="solid" className="bg-red-500/10 text-red-500">
        Refused
      </Badge>
    ),
  };

  return votingStatus[vote];
}
