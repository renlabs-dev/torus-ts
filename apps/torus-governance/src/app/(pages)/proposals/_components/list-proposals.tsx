"use client";

import type { ProposalStatus } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { ContentNotFound } from "@torus-ts/ui/components/content-not-found";
import { CardSkeleton } from "~/app/_components/dao-card/components/card-skeleton";
import { ProposalCard } from "~/app/(pages)/proposals/_components/proposal-card";
import { useGovernance } from "~/context/governance-provider";
import { handleCustomProposal } from "~/utils";
import type { VoteStatus } from "~/utils/types";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";

const ListCardsLoadingSkeleton = () => {
  const delayValues = [200, 500, 700];

  return (
    <div className="w-full space-y-4">
      {delayValues.map((delay) => (
        <div key={delay} className={`animate-fade-up animate-delay-${delay}`}>
          <CardSkeleton />
        </div>
      ))}
    </div>
  );
};

const EmptyState = () => (
  <ContentNotFound message="No Proposals matching the search criteria were found." />
);

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
    const statusFilter = searchParams.get("status");

    return proposalsWithMeta
      .reverse()
      .map((proposal) => {
        const { title, invalid, body } = handleCustomProposal(proposal);

        if (invalid || (!title && !body)) return null;

        const matchesSearch =
          !search ||
          (title?.toLowerCase() ?? "").includes(search) ||
          (body?.toLowerCase() ?? "").includes(search) ||
          proposal.proposer.toLowerCase().includes(search);

        if (!matchesSearch) return null;

        if (statusFilter && statusFilter !== "all") {
          const statusLower = statusFilter.toLowerCase();
          const proposalStatusKey = Object.keys(
            proposal.status,
          )[0]?.toLowerCase();

          if (statusLower === "active" && proposalStatusKey !== "open")
            return null;
          if (statusLower === "accepted" && proposalStatusKey !== "accepted")
            return null;
          if (statusLower === "rejected" && proposalStatusKey !== "rejected")
            return null;
          if (statusLower === "expired" && proposalStatusKey !== "expired")
            return null;
        }

        const voted = getUserVoteStatus(
          proposal.status,
          selectedAccount?.address as SS58Address,
        );

        return (
          <Link href={`/proposal/${proposal.id}`} key={proposal.id} prefetch>
            <ProposalCard
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
      .filter(Boolean); // Remove null values
  }, [proposalsWithMeta, searchParams, selectedAccount, currentBlock]);

  if (isLoading) return <ListCardsLoadingSkeleton />;
  if (filteredProposals.length === 0) return <EmptyState />;

  return filteredProposals;
};
