"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { ProposalStatus, SS58Address } from "@torus-ts/subspace";

import type { VoteStatus } from "./vote-label";
import { useGovernance } from "~/context/governance-provider";
import {
  calcProposalFavorablePercent,
  handleCustomAgentApplications,
  handleCustomProposal,
} from "~/utils";
import { CardSkeleton } from "./card-skeleton";
import { CardViewData } from "./card-view-data";

const ListCardsLoadingSkeleton = () => {
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

const NoContentFound = () => {
  return (
    <div>
      <p>Content not found.</p>
    </div>
  );
};

type ViewModes = "proposals" | "agent-applications" | null;

const ListCardsContent = () => {
  const {
    isInitialized,
    lastBlock,

    selectedAccount,

    proposals,
    proposalsWithMeta,
    agentApplications,
    agentApplicationsWithMeta,
  } = useGovernance();

  const contentRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const currentBlock = lastBlock.data?.blockNumber;

  const [isOverflowing, setIsOverflowing] = useState(false);

  const viewMode = useMemo((): ViewModes => {
    const currentView = searchParams.get("view");
    if (currentView !== "proposals" && currentView !== "agent-applications")
      return null;
    return currentView as ViewModes;
  }, [searchParams]);

  const isLoadingagentApplications = useMemo(() => {
    if (!isInitialized) return true;
    if (!agentApplicationsWithMeta || agentApplications.isPending) return true;
    return false;
  }, [isInitialized, agentApplicationsWithMeta, agentApplications.isPending]);

  const isLoadingProposals = useMemo(() => {
    if (isInitialized === false) return true;
    if (!proposalsWithMeta || proposals.isPending) return true;
    return false;
  }, [isInitialized, proposalsWithMeta, proposals.isPending]);

  const handleIsLoading = (viewMode: ViewModes): boolean => {
    switch (viewMode) {
      case "agent-applications":
        return isLoadingagentApplications;
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
        const { title, invalid, body } = handleCustomProposal(proposal);
        if (invalid || (!title && !body)) return null;

        const search = searchParams.get("search")?.toLocaleLowerCase();
        if (
          search &&
          !title?.toLocaleLowerCase().includes(search) &&
          !body?.toLocaleLowerCase().includes(search) &&
          !proposal.proposer.toLocaleLowerCase().includes(search)
        )
          return null;

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
  }, [currentBlock, proposalsWithMeta, searchParams, selectedAccount?.address]);

  const renderagentApplications = useMemo((): JSX.Element[] => {
    if (!agentApplicationsWithMeta) return [];

    return agentApplicationsWithMeta
      .map((app) => {
        const { title, body } = handleCustomAgentApplications(
          app.id,
          app.customData ?? null,
        );

        if (!body) return null;

        const search = searchParams.get("search")?.toLocaleLowerCase();

        if (
          search &&
          !title?.toLocaleLowerCase().includes(search) &&
          !body.toLocaleLowerCase().includes(search) &&
          !app.payerKey.toLocaleLowerCase().includes(search)
        )
          return null;

        return (
          <Link href={`/agent-application/${app.id}`} key={app.id} prefetch>
            <CardViewData
              title={title}
              author={app.payerKey}
              // agentApplicationstatus={app.status}
            />
          </Link>
        );
      })
      .filter((element): element is JSX.Element => element !== null);
  }, [agentApplicationsWithMeta, searchParams]);

  const content = useMemo(() => {
    switch (viewMode) {
      case "proposals":
        return renderProposals;
      case "agent-applications":
        return renderagentApplications;
      default:
        return null;
    }
  }, [viewMode, renderProposals, renderagentApplications]);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const maxAllowedHeight = window.innerHeight - 280;
      setIsOverflowing(contentHeight > maxAllowedHeight);
      scrollTo({ top: 100, behavior: "smooth" });
    }
  }, [viewMode, content]);

  if (handleIsLoading(viewMode)) return <ListCardsLoadingSkeleton />;

  return (
    <div
      ref={contentRef}
      className={`max-h-[calc(100vh-280px)] overflow-y-auto md:max-h-[calc(100vh-210px)]`}
    >
      <div
        className={`flex flex-col-reverse gap-6 ${isOverflowing ? "pr-1 md:pr-2" : ""}`}
      >
        {content ?? <NoContentFound />}
      </div>
    </div>
  );
};

export const ListCards = () => {
  return (
    <Suspense fallback={<ListCardsLoadingSkeleton />}>
      <ListCardsContent />
    </Suspense>
  );
};
