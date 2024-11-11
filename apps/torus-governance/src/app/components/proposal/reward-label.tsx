import { match } from "rustie";

import type { ProposalStatus } from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Badge } from "@torus-ts/ui";

interface RewardLabelProps {
  result: ProposalStatus;
  proposalId: number;
  className?: string;
}

export function RewardLabel(props: RewardLabelProps): JSX.Element {
  const { result, proposalId, className = "" } = props;
  const { unrewardedProposals } = useTorus();

  const isUnrewarded = unrewardedProposals?.includes(proposalId);

  const getRewardStatus = () => {
    return match(result)({
      open: () => ({
        text: "Unrewarded",
        className: "bg-purple-500/10 text-purple-500",
      }),
      accepted: () =>
        isUnrewarded
          ? {
            text: "Unrewarded",
            className: "bg-purple-500/10 text-purple-500",
          }
          : {
            text: "Rewarded",
            className: "bg-green-500/10 text-green-500",
          },
      expired: () =>
        isUnrewarded
          ? {
            text: "Unrewarded",
            className: "bg-purple-500/10 text-purple-500",
          }
          : {
            text: "Rewarded",
            className: "bg-green-500/10 text-green-500",
          },
      refused: () =>
        isUnrewarded
          ? {
            text: "Unrewarded",
            className: "bg-purple-500/10 text-purple-500",
          }
          : {
            text: "Rewarded",
            className: "bg-green-500/10 text-green-500",
          },
    });
  };

  const { text, className: statusClassName } = getRewardStatus();

  return <Badge className={` border-none ${statusClassName} ${className}`}>{text}</Badge>;
}
