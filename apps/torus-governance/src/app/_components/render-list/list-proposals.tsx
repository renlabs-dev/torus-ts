"use client";

import type { ProposalStatus, SS58Address } from "@torus-network/sdk";
import { useGovernance } from "~/context/governance-provider";
import { handleCustomProposal } from "~/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { CardSkeleton } from "../card-skeleton";
import { CardViewData } from "../card-view-data";
import type { VoteStatus } from "../vote-label";

const ListCardsLoadingSkeleton = () => {
  return (
    <div className="w-full space-y-4">
      <div className="animate-fade-up animate-delay-200">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-500">
        <CardSkeleton />
      </div>
      <div className="animate-fade-up animate-delay-700">
        <CardSkeleton />
      </div>
    </div>
  );
};

function getUserVoteStatus(
  proposalStatus: ProposalStatus,
  selectedAccountAddress: SS58Address,
): VoteStatus {
  if (!("Open" in proposalStatus)) return "UNVOTED";

  const { votesFor, votesAgainst } = proposalStatus.Open;
  if (votesFor.includes(selectedAccountAddress)) return "FAVORABLE";
  if (votesAgainst.includes(selectedAccountAddress)) return "AGAINST";

  return "UNVOTED";
}

export const ListProposals = () => {
  const {
    proposalsWithMeta,
    selectedAccount,
    lastBlock,
    isInitialized,
    proposals,
  } = useGovernance();
  const currentBlock = lastBlock.data?.blockNumber;
  const searchParams = useSearchParams();

  const isLoading = !proposalsWithMeta || proposals.isPending || !isInitialized;

  const filteredProposals = useMemo(() => {
    if (!proposalsWithMeta) return [];

    const search = searchParams.get("search")?.toLowerCase();

    return proposalsWithMeta
      .map((proposal) => {
        const { title, invalid, body } = handleCustomProposal(proposal);
        if (invalid || (!title && !body)) return null;

        // Handle search filtering - if no search query, show all
        const matchesSearch =
          !search ||
          (title?.toLowerCase() ?? "").includes(search) ||
          (body?.toLowerCase() ?? "").includes(search) ||
          proposal.proposer.toLowerCase().includes(search);

        if (!matchesSearch) return null;

        const voted = getUserVoteStatus(
          proposal.status,
          selectedAccount?.address as SS58Address,
        );

        return (
          <Link href={`/proposal/${proposal.id}`} key={proposal.id} prefetch>
            <CardViewData
              title={title}
              author={proposal.proposer}
              voted={voted}
              proposalType={proposal.data}
              proposalStatus={proposal.status}
              expirationBlock={proposal.expirationBlock}
              currentBlock={currentBlock}
            />
          </Link>
        );
      })
      .filter(Boolean);
  }, [proposalsWithMeta, searchParams, selectedAccount, currentBlock]);

  if (isLoading) return <ListCardsLoadingSkeleton />;

  if (filteredProposals.length === 0) {
    return (
      <p className="animate-fade-down duration-500">No proposals found.</p>
    );
  }

  return filteredProposals;
};
