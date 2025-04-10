import { Badge } from "@torus-ts/ui/components/badge";
import type { VoteStatus } from "~/utils/types";

interface VoteLabelProps {
  vote: VoteStatus;
}

export function ProposalVoteLabel(props: VoteLabelProps) {
  const { vote } = props;

  const votingStatus = {
    UNVOTED: <></>,
    FAVORABLE: (
      <Badge
        variant="solid"
        className="bg-cyan-500/20 text-cyan-500 hover:bg-cyan-500/10"
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
