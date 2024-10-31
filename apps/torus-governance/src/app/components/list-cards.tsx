"use client"

import { useTorus } from "@torus-ts/providers/use-torus";
import type { ProposalStatus, SS58Address } from "@torus-ts/types";
import { DaoCard } from "./dao/dao-card";
import { ProposalCard } from "./proposal/proposal-card";
import { CardSkeleton } from "./card-skeleton";
import type { VoteStatus } from "./vote-label";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

function getUserVoteStatus(proposalStatus: ProposalStatus, selectedAccountAddress: SS58Address): VoteStatus {
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
  )
}

type ViewModes = "proposals" | "daos";

export const ListCards = () => {
  const {
    proposalsWithMeta,
    isProposalsLoading,
    daosWithMeta,
    isDaosLoading,
    selectedAccount,
    isInitialized,
  } = useTorus();

  const searchParams = useSearchParams();

  const viewMode = useMemo((): ViewModes => {
    const currentView = searchParams.get('view')
    if (currentView !== "proposals" && currentView !== "daos") return "proposals"
    return currentView as ViewModes
  }, [searchParams]);

  const isLoadingDaos = useMemo(() => {
    if (!isInitialized) return true
    if (!daosWithMeta || isDaosLoading) return true
    return false

  }, [isInitialized, daosWithMeta, isDaosLoading])

  const isLoadingProposals = useMemo(() => {
    if (isInitialized === false) return true
    if (!proposalsWithMeta || isProposalsLoading) return true
    return false
  }, [isInitialized, proposalsWithMeta, isProposalsLoading])


  const handleIsLoading = (viewMode: ViewModes): boolean => {
    switch (viewMode) {
      case "daos":
        return isLoadingDaos;
      case "proposals":
        return isLoadingProposals;
      default:
        return false;
    }
  }

  const renderProposals = useMemo((): JSX.Element[] | undefined => {
    const proposalsContent = proposalsWithMeta?.map((proposal) => {
      const voted = getUserVoteStatus(
        proposal.status,
        selectedAccount?.address as SS58Address,
      );

      return (
        <div key={proposal.id}>
          <ProposalCard
            key={proposal.id}
            proposalState={proposal}
            voted={voted}
          />
        </div>
      );
    });
    return proposalsContent;
  }, [proposalsWithMeta, selectedAccount?.address]);

  const renderDaos = useMemo((): JSX.Element[] | undefined => {
    const daosContent = daosWithMeta?.map((dao) => {
      return (
        <div key={dao.id}>
          <DaoCard daoState={dao} key={dao.id} />
        </div>
      );
    });

    return daosContent;
  }, [daosWithMeta])

  const content = useMemo(() => {
    switch (viewMode) {
      case "proposals":
        return renderProposals;
      case "daos":
        return renderDaos;
      default:
        return null;
    }
  }, [viewMode, renderProposals, renderDaos]);

  const renderLoading = () => {
    return (
      <div className="w-full space-y-10 py-10">
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
    )
  }

  if (handleIsLoading(viewMode)) return renderLoading()

  return (
    <div className="w-full space-y-10 py-10">
      {content ?? <NoContentFound />}
    </div>
  )
}