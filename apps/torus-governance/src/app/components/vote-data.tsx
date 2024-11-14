import type { ProposalStatus } from "@torus-ts/subspace/old";
import { Card, CardHeader } from "@torus-ts/ui/components";

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
      <Card className="animate-fade-down p-6 animate-delay-500">
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
    <Card className="animate-fade-down border-muted p-6 animate-delay-500">
      <CardHeader className="pl-0 pt-0">
        <h3>Voting</h3>
      </CardHeader>
      <div className="flex justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          Favorable
        </span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesInFavor(proposalStatus)}
            <span className="text-muted-foreground"> TOR</span>
          </span>
          <span className="pl-2 text-sm font-semibold text-muted-foreground">
            {favorablePercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="my-2 w-full rounded-lg bg-accent">
        <div
          className="rounded-lg bg-muted py-2"
          style={{
            width: `${favorablePercent.toFixed(0)}%`,
          }}
        />
      </div>
      <div className="mt-6 flex justify-between">
        <span className="font-semibold text-muted-foreground">Against</span>
        <div className="flex items-center gap-2 divide-x">
          <span className="text-xs">
            {handleProposalVotesAgainst(proposalStatus)}
            <span className="text-muted-foreground"> TOR</span>
          </span>
          <span className="pl-2 text-sm font-semibold text-muted-foreground">
            {againstPercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="my-2 w-full rounded-lg bg-accent">
        <div
          className="rounded-lg bg-muted py-2"
          style={{
            width: `${againstPercent.toFixed(0)}%`,
          }}
        />
      </div>
    </Card>
  );
};
