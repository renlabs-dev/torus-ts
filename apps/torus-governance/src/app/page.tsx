"use client";

import { useState } from "react";

import type { ProposalStatus, SS58Address } from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Container } from "@torus-ts/ui";

import type { VoteStatus } from "./components/vote-label";
import { BalanceSection } from "./components/balance-section";
import { CardSkeleton } from "./components/card-skeleton";
import { DaoCard } from "./components/dao/dao-card";
import { FooterDivider } from "./components/footer-divider";
import { ProposalListHeader } from "./components/proposal-list-header";
import { ProposalCard } from "./components/proposal/proposal-card";

export default function HomePage(): JSX.Element {
  const {
    proposalsWithMeta,
    isProposalsLoading,
    daosWithMeta,
    isDaosLoading,
    selectedAccount,
    daoTreasury,
    isInitialized,
  } = useTorus();

  const [viewMode, setViewMode] = useState<"proposals" | "daos">("proposals");

  function handleIsLoading(type: "proposals" | "daos"): boolean {
    switch (type) {
      case "daos":
        return isDaosLoading;
      case "proposals":
        return isProposalsLoading;
      default:
        return false;
    }
  }

  const isLoading = handleIsLoading(viewMode);

  const handleUserVotes = ({
    proposalStatus,
    selectedAccountAddress,
  }: {
    proposalStatus: ProposalStatus;
    selectedAccountAddress: SS58Address;
  }): VoteStatus => {
    if (!Object.prototype.hasOwnProperty.call(proposalStatus, "open"))
      return "UNVOTED";

    if (
      "open" in proposalStatus &&
      proposalStatus.open.votesFor.includes(selectedAccountAddress)
    ) {
      return "FAVORABLE";
    }
    if (
      "open" in proposalStatus &&
      proposalStatus.open.votesAgainst.includes(selectedAccountAddress)
    ) {
      return "AGAINST";
    }

    return "UNVOTED";
  };

  function renderProposals(): JSX.Element[] | undefined {
    const proposalsContent = proposalsWithMeta?.map((proposal) => {
      const voted = handleUserVotes({
        proposalStatus: proposal.status,
        selectedAccountAddress: selectedAccount?.address as SS58Address,
      });

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
  }

  function renderDaos(): JSX.Element[] | undefined {
    const daosContent = daosWithMeta?.map((dao) => {
      return (
        <div key={dao.id}>
          <DaoCard daoState={dao} key={dao.id} />
        </div>
      );
    });

    return daosContent;
  }

  const content = viewMode === "proposals" ? renderProposals() : renderDaos();

  return (
    <main className="flex w-full flex-col items-center justify-center">
      <div className="h-full w-full bg-repeat">
        <Container>
          <BalanceSection className="hidden lg:flex" />

          <ProposalListHeader
            setViewMode={setViewMode}
            viewMode={viewMode}
            daoTreasury={daoTreasury}
          />
          <div className="w-full space-y-10 py-10">
            {isLoading ||
            !isInitialized ||
            !proposalsWithMeta ||
            !daosWithMeta ? (
              <div className="flex flex-col gap-10">
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
            ) : (
              content
            )}
          </div>
          <FooterDivider />
        </Container>
      </div>
    </main>
  );
}
