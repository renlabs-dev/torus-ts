import { match } from "rustie";

import type { ProposalStatus } from "@commune-ts/types";
import { useCommune } from "@commune-ts/providers/use-commune";
import { Badge } from "@commune-ts/ui";

interface RewardLabelProps {
  result: ProposalStatus;
  proposalId: number;
  className?: string;
}

export function RewardLabel(props: RewardLabelProps): JSX.Element {
  const { result, proposalId, className = "" } = props;
  const { unrewardedProposals } = useCommune();

  const isUnrewarded = unrewardedProposals?.includes(proposalId);

  const getRewardStatus = () => {
    return match(result)({
      open: () => ({
        text: "Unrewarded",
        className: "border-purple-500 bg-purple-500/10 text-purple-500",
      }),
      accepted: () =>
        isUnrewarded
          ? {
              text: "Unrewarded",
              className: "border-purple-500 bg-purple-500/10 text-purple-500",
            }
          : {
              text: "Rewarded",
              className: "border-green-500 bg-green-500/10 text-green-500",
            },
      expired: () =>
        isUnrewarded
          ? {
              text: "Unrewarded",
              className: "border-purple-500 bg-purple-500/10 text-purple-500",
            }
          : {
              text: "Rewarded",
              className: "border-green-500 bg-green-500/10 text-green-500",
            },
      refused: () =>
        isUnrewarded
          ? {
              text: "Unrewarded",
              className: "border-purple-500 bg-purple-500/10 text-purple-500",
            }
          : {
              text: "Rewarded",
              className: "border-green-500 bg-green-500/10 text-green-500",
            },
    });
  };

  const { text, className: statusClassName } = getRewardStatus();

  return <Badge className={`${statusClassName} ${className}`}>{text}</Badge>;
}
