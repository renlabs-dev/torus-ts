import type { ProposalStatus } from "@torus-network/sdk";

import { Card, CardHeader } from "@torus-ts/ui/components/card";

import {
  calcProposalFavorablePercent,
  handleProposalVotesAgainst,
  handleProposalVotesInFavor,
} from "~/utils";

interface VoteDataProps {
  proposalStatus: ProposalStatus;
}

export const VoteData = (props: VoteDataProps) => {
  const { proposalStatus } = props;
  const favorablePercent = calcProposalFavorablePercent(proposalStatus);

  if (favorablePercent === null) {
    return (
      <Card className="animate-fade-down animate-delay-[1400ms] p-4 md:p-6">
        <CardHeader className="pl-0 pt-0">
          <h3>Voting</h3>
        </CardHeader>
        <p className="text-muted-foreground">
          This proposal has no votes yet or is closed.
        </p>
      </Card>
    );
  }

  const againstPercent = 100 - favorablePercent;
  return (
    <Card className="animate-fade-down border-border animate-delay-[1400ms] p-4 md:p-6">
      <CardHeader className="pl-0 pt-0">
        <h3>Voting</h3>
      </CardHeader>
      <div className="flex justify-between">
        <span className="text-muted-foreground text-sm font-semibold">
          Favorable
        </span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesInFavor(proposalStatus)}
            <span className="text-muted-foreground"> TORUS</span>
          </span>
          <span className="text-muted-foreground pl-2 text-sm font-semibold">
            {favorablePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="rounded-radius bg-primary-foreground my-2 w-full">
        <div
          className="rounded-radius bg-white/60 py-2"
          style={{
            width: `${favorablePercent.toFixed(0)}%`,
          }}
        />
      </div>
      <div className="mt-6 flex justify-between">
        <span className="text-muted-foreground font-semibold">Against</span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesAgainst(proposalStatus)}
            <span className="text-muted-foreground"> TORUS</span>
          </span>
          <span className="text-muted-foreground pl-2 text-sm font-semibold">
            {againstPercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="rounded-radius bg-primary-foreground my-2 w-full">
        <div
          className="rounded-radius bg-white/60 py-2"
          style={{
            width: `${againstPercent.toFixed(0)}%`,
          }}
        />
      </div>
    </Card>
  );
};
