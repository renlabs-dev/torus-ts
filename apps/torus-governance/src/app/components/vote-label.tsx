import { Badge } from "@torus-ts/ui/components/badge";

export type VoteStatus = "FAVORABLE" | "AGAINST" | "UNVOTED";

interface VoteLabelProps {
  vote: VoteStatus;
}

export function VoteLabel(props: VoteLabelProps): JSX.Element {
  const { vote } = props;

  const votingStatus = {
    UNVOTED: <></>,
    FAVORABLE: (
      <Badge
        variant="solid"
        className="bg-green-500/10 text-green-500 hover:bg-green-500/10"
      >
        Favorable
      </Badge>
    ),
    AGAINST: (
      <Badge
        variant="solid"
        className="bg-red-500/10 text-red-500 hover:bg-red-500/10"
      >
        Against
      </Badge>
    ),
  };
  return votingStatus[vote];
}
