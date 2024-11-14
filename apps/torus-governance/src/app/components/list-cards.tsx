"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { SS58Address } from "@torus-ts/subspace/address";
import type { ProposalStatus } from "@torus-ts/subspace/old";
import { useTorus } from "@torus-ts/providers/use-torus";

import type { VoteStatus } from "./vote-label";
import {
  calcProposalFavorablePercent,
  handleCustomDaos,
  handleCustomProposal,
} from "~/utils";
import { CardSkeleton } from "./card-skeleton";
import { CardViewData } from "./card-view-data";

function getUserVoteStatus(
  proposalStatus: ProposalStatus,
  selectedAccountAddress: SS58Address,
): VoteStatus {
  if (!("open" in proposalStatus)) return "UNVOTED";

  const { votesFor, votesAgainst } = proposalStatus.open;
  if (votesFor.includes(selectedAccountAddress)) return "FAVORABLE";
  if (votesAgainst.includes(selectedAccountAddress)) return "AGAINST";

  return "UNVOTED";
}

const NoContentFound = () => {
  return (
    <div>
      <p>Content not found.</p>
    </div>
  );
};

type ViewModes = "proposals" | "daos-applications" | null;

const ListCardsContent = () => {
  const {
    proposalsWithMeta,
    isProposalsLoading,
    daosWithMeta,
    isDaosLoading,
    selectedAccount,
    isInitialized,
    lastBlock,
  } = useTorus();

  const searchParams = useSearchParams();
  const currentBlock = lastBlock?.blockNumber;

  const viewMode = useMemo((): ViewModes => {
    const currentView = searchParams.get("view");
    if (currentView !== "proposals" && currentView !== "daos-applications")
      return null;
    return currentView as ViewModes;
  }, [searchParams]);

  const isLoadingDaos = useMemo(() => {
    if (!isInitialized) return true;
    if (!daosWithMeta || isDaosLoading) return true;
    return false;
  }, [isInitialized, daosWithMeta, isDaosLoading]);

  const isLoadingProposals = useMemo(() => {
    if (isInitialized === false) return true;
    if (!proposalsWithMeta || isProposalsLoading) return true;
    return false;
  }, [isInitialized, proposalsWithMeta, isProposalsLoading]);

  const handleIsLoading = (viewMode: ViewModes): boolean => {
    switch (viewMode) {
      case "daos-applications":
        return isLoadingDaos;
      case "proposals":
        return isLoadingProposals;
      default:
        return false;
    }
  };

  const renderProposals = useMemo((): JSX.Element[] => {
    if (!proposalsWithMeta) return [];

    return proposalsWithMeta
      .map((proposal) => {
        const { title, invalid } = handleCustomProposal(proposal);

        if (invalid) return null;

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
              favorablePercent={calcProposalFavorablePercent(proposal.status)}
            />
          </Link>
        );
      })
      .filter((element): element is JSX.Element => element !== null);
  }, [currentBlock, proposalsWithMeta, selectedAccount?.address]);

  const renderDaos = useMemo((): JSX.Element[] => {
    if (!daosWithMeta) return [];

    return daosWithMeta
      .map((dao) => {
        const { title, body } = handleCustomDaos(
          dao.id,
          dao.customData ?? null,
        );

        if (!body) return null;

        return (
          <Link href={`/dao/${dao.id}`} key={dao.id} prefetch>
            <CardViewData
              title={title}
              author={dao.userId}
              daoStatus={dao.status}
            />
          </Link>
        );
      })
      .filter((element): element is JSX.Element => element !== null);
  }, [daosWithMeta]);

  const content = useMemo(() => {
    switch (viewMode) {
      case "proposals":
        return renderProposals;
      case "daos-applications":
        return renderDaos;
      default:
        return null;
    }
  }, [viewMode, renderProposals, renderDaos]);

  const renderLoading = () => {
    return (
      <div className="w-full space-y-6">
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

  if (handleIsLoading(viewMode)) return renderLoading();

  return (
    <div className="flex flex-col gap-6">{content ?? <NoContentFound />}</div>
  );
};

export const ListCards = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ListCardsContent />
    </Suspense>
  );
};
