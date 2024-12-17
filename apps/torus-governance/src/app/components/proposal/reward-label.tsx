import { match } from "rustie";

import type { ProposalStatus } from "@torus-ts/subspace";
import { Badge } from "@torus-ts/ui";

import { useGovernance } from "~/context/governance-provider";

interface RewardLabelProps {
  result: ProposalStatus;
  proposalId: number;
  className?: string;
}

export function RewardLabel(props: RewardLabelProps): JSX.Element {
  const { result, proposalId, className = "" } = props;
  const { unrewardedProposals } = useGovernance();

  const isUnrewarded = unrewardedProposals.data?.includes(proposalId);

  const getRewardStatus = () => {
    return match(result)({
      Open: () => ({
        text: "Unrewarded",
        className: "bg-purple-500/10 text-purple-500",
      }),
      Accepted: () =>
        isUnrewarded
          ? {
              text: "Unrewarded",
              className: "bg-purple-500/10 text-purple-500",
            }
          : {
              text: "Rewarded",
              className: "bg-green-500/10 text-green-500",
            },
      Expired: () =>
        isUnrewarded
          ? {
              text: "Unrewarded",
              className: "bg-purple-500/10 text-purple-500",
            }
          : {
              text: "Rewarded",
              className: "bg-green-500/10 text-green-500",
            },
      Refused: () =>
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

  return (
    <Badge className={`border-none ${statusClassName} ${className}`}>
      {text}
    </Badge>
  );
}
