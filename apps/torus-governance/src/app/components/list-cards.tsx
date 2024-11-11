"use client"

import { useTorus } from "@torus-ts/providers/use-torus";
import type { ProposalStatus, SS58Address } from "@torus-ts/types";
import { CardViewData } from "./card-view-data";
import { CardSkeleton } from "./card-skeleton";
import type { VoteStatus } from "./vote-label";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { handleCustomDaos, handleCustomProposal } from "~/utils";
import Link from "next/link";

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

type ViewModes = "proposals" | "daos-applications" | null;

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
    if (currentView !== "proposals" && currentView !== "daos-applications") return null
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
      case "daos-applications":
        return isLoadingDaos;
      case "proposals":
        return isLoadingProposals;
      default:
        return false;
    }
  }

  const renderProposals = useMemo((): JSX.Element[] => {
    if (!proposalsWithMeta) return [];

    return proposalsWithMeta
      .map((proposal) => {
        const { title, invalid } = handleCustomProposal(proposal);

        if (invalid) return null;

        const voted = getUserVoteStatus(
          proposal.status,
          selectedAccount?.address as SS58Address
        );

        return (
          <Link href={`/proposal/${proposal.id}`} key={proposal.id}>
            <CardViewData
              title={title}
              author={proposal.proposer}
              voted={voted}
              proposalType={proposal.data}
              proposalStatus={proposal.status}
              dueDate
            />
          </Link>
        );
      })
      .filter((element): element is JSX.Element => element !== null);
  }, [proposalsWithMeta, selectedAccount?.address]);

  const renderDaos = useMemo((): JSX.Element[] => {
    if (!daosWithMeta) return [];

    return daosWithMeta
      .map((dao) => {
        const { title, body } = handleCustomDaos(dao.id, dao.customData ?? null);

        if (!body) return null;

        return (
          <Link href={`/dao/${dao.id}`} key={dao.id}>
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
    )
  }

  if (handleIsLoading(viewMode)) return renderLoading()

  return (
    <div className="flex flex-col gap-6">
      {content ?? <NoContentFound />}
    </div>
  )
}