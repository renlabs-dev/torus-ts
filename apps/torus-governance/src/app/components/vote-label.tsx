import { Badge } from "@torus-ts/ui";

export type VoteStatus = "FAVORABLE" | "AGAINST" | "UNVOTED";

interface VoteLabelProps {
  vote: VoteStatus;
}

export function VoteLabel(props: VoteLabelProps): JSX.Element {
  const { vote } = props;

  const votingStatus = {
    UNVOTED: <></>,
    FAVORABLE: (
      <Badge variant="solid" className="text-green-500 bg-green-500/10">
        Favorable
      </Badge>
    ),
    AGAINST: (
      <Badge variant="solid" className="text-red-500 bg-red-500/10">
        Against
      </Badge>
    ),
  };

  return votingStatus[vote];
}
