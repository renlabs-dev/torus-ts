"use client";

import type { ProposalStatus, SS58Address } from "@torus-network/sdk";
import { useProcessVotesAndStakes } from "@torus-ts/query-provider/hooks";
import { CreateComment } from "~/app/_components/comments/create-comment";
import { ViewComment } from "~/app/_components/comments/view-comment";
import { DetailsCard } from "~/app/_components/details-card";
import { ExpandedViewContent } from "~/app/_components/expanded-view-content";
import { ProposalTypeLabel } from "~/app/_components/proposal/proposal-type-label";
import { ProposalVoteCard } from "~/app/_components/proposal/proposal-vote-card";
import { RewardLabel } from "~/app/_components/proposal/reward-label";
import { VoterList } from "~/app/_components/proposal/voter-list";
import { VoteData } from "~/app/_components/vote-data";
import { useGovernance } from "~/context/governance-provider";
import type { VoteStatus } from "~/utils/types";
import { LoaderCircle } from "lucide-react";
import { useMemo } from "react";
import { ProposalStatusLabel } from "../../../../_components/proposal/proposal-status-label";
import { handleCustomProposal } from "../../../../../utils";

interface CustomContent {
  paramId: number;
}

const handleUserVotes = ({
  proposalStatus,
  selectedAccountAddress,
}: {
  proposalStatus: ProposalStatus;
  selectedAccountAddress: SS58Address;
}): VoteStatus => {
  if (!Object.hasOwn(proposalStatus, "Open")) return "UNVOTED";

  if (
    "Open" in proposalStatus &&
    proposalStatus.Open.votesFor.includes(selectedAccountAddress)
  ) {
    return "FAVORABLE";
  }
  if (
    "Open" in proposalStatus &&
    proposalStatus.Open.votesAgainst.includes(selectedAccountAddress)
  ) {
    return "AGAINST";
  }

  return "UNVOTED";
};

export function ProposalExpandedView(props: Readonly<CustomContent>) {
  const { paramId } = props;
  const {
    api,
    lastBlock,
    proposals,
    proposalsWithMeta,
    selectedAccount,
    torusCacheUrl,
  } = useGovernance();

  const content = useMemo(() => {
    const proposal = proposalsWithMeta?.find(
      (proposal) => proposal.id === paramId,
    );
    if (!proposal) return null;

    const { body, title, invalid } = handleCustomProposal(proposal);

    const voted = handleUserVotes({
      proposalStatus: proposal.status,
      selectedAccountAddress: selectedAccount?.address as SS58Address,
    });

    const proposalContent = {
      body,
      title,
      invalid,
      id: proposal.id,
      status: proposal.status,
      data: proposal.data,
      author: proposal.proposer,
      expirationBlock: proposal.expirationBlock,
      creationBlock: proposal.creationBlock,
      voted,
    };

    return proposalContent;
  }, [proposalsWithMeta, paramId, selectedAccount]);

  const votesFor =
    content && "Open" in content.status ? content.status.Open.votesFor : [];

  const votesAgainst =
    content && "Open" in content.status ? content.status.Open.votesAgainst : [];

  const {
    data: votersList,
    isLoading: votersListLoading,
    isError: votersListError,
    refetch: votersListRefetch,
  } = useProcessVotesAndStakes(api, torusCacheUrl, votesFor, votesAgainst);

  if (proposals.isLoading || !proposalsWithMeta)
    return (
      <div className="flex h-full w-full items-center justify-center lg:h-auto">
        <h1 className="text-2xl text-white">Loading...</h1>
        <LoaderCircle className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  if (!content) return <div>No content found.</div>;

  const isProposalOpen = "Open" in content.status;

  const votersListProps = {
    isError: votersListError,
    isLoading: votersListLoading,
    voters: votersList,
  };

  const proposalVoteCardProps = {
    proposalId: content.id,
    proposalStatus: content.status,
    voted: content.voted,
    votersListRefetch,
  };

  const detailsCardProps = {
    author: content.author,
    id: content.id,
    creationBlock: content.creationBlock,
    expirationBlock: content.expirationBlock,
    lastBlockNumber: lastBlock.data?.blockNumber ?? 0,
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-row items-center gap-2">
        <ProposalTypeLabel proposalType={content.data} />
        <ProposalStatusLabel status={content.status} />
        <RewardLabel proposalId={content.id} result={content.status} />
      </div>
      <div className="flex w-full gap-10">
        <div className="flex h-full w-full flex-col gap-14 md:w-2/3">
          <ExpandedViewContent body={content.body} title={content.title} />

          {/* Mobile Details Section */}
          <div className="flex w-full flex-col gap-6 transition-all md:hidden">
            <DetailsCard {...detailsCardProps} />
            {isProposalOpen && (
              <>
                <ProposalVoteCard {...proposalVoteCardProps} />
                <VoteData proposalStatus={content.status} />
              </>
            )}
          </div>

          {/* Desktop Proposal Vote Card */}
          {isProposalOpen && (
            <div className="hidden md:block">
              <ProposalVoteCard {...proposalVoteCardProps} />
            </div>
          )}

          {/* Comments Section */}
          <ViewComment itemType="PROPOSAL" id={content.id} />
          <CreateComment id={content.id} itemType="PROPOSAL" />

          {isProposalOpen && <VoterList {...votersListProps} />}
        </div>

        {/* Right Column */}
        <div className="hidden flex-col gap-6 transition-all md:flex lg:w-1/3">
          <DetailsCard {...detailsCardProps} />
          <VoteData proposalStatus={content.status} />
        </div>
      </div>
    </div>
  );
}
