import type { ProposalStatus } from "@torus-ts/subspace";
import { Skeleton } from "@torus-ts/ui";
import { calcProposalFavorablePercent } from "~/utils";

export const VotePercentageBar = (props: {
  // favorablePercent: number | null | undefined;
  proposalStatus: ProposalStatus;
}) => {
  const { proposalStatus } = props;
  if (!("Open" in proposalStatus)) return null;

  const haveVotes =
    proposalStatus.Open.stakeFor > 0 || proposalStatus.Open.stakeAgainst > 0;
  if (!haveVotes) return null;

  const favorablePercent = calcProposalFavorablePercent(proposalStatus);

  if (favorablePercent === null) {
    return (
      <div className="flex w-full animate-pulse justify-between">
        <Skeleton className="w-full !rounded-full py-4" />
      </div>
    );
  }

  const againstPercent = 100 - favorablePercent;

  return (
    <div className="relative h-8 w-full overflow-hidden rounded-full border border-border bg-primary-foreground">
      <div
        className="h-full rounded-full rounded-r-none bg-accent"
        style={{ width: `${favorablePercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
        <div className="flex items-center gap-2 text-xs">
          Favorable
          <span className="text-muted-foreground">
            {favorablePercent.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          Against
          <span className="text-muted-foreground">
            {againstPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};
