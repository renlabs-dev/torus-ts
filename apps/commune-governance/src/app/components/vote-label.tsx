import { Badge } from "@commune-ts/ui";

export type VoteStatus = "FAVORABLE" | "AGAINST" | "UNVOTED";

interface VoteLabelProps {
  vote: VoteStatus;
}

export function VoteLabel(props: VoteLabelProps): JSX.Element {
  const { vote } = props;

  const votingStatus = {
    UNVOTED: <></>,
    FAVORABLE: (
      <Badge className="border-green-500 bg-green-500/10 text-green-500">
        Favorable
      </Badge>
    ),
    AGAINST: (
      <Badge className="border-red-500 bg-red-500/10 text-red-500">
        Against
      </Badge>
    ),
  };

  return votingStatus[vote];
}
