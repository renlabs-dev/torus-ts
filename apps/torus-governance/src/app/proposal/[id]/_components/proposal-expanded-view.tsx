"use client";

import { useMemo } from "react";
import { LoaderCircle } from "lucide-react";

import type { ProposalStatus, SS58Address } from "@torus-ts/subspace/old";
import { useTorus } from "@torus-ts/providers/use-torus";

import type { VoteStatus } from "../../../components/vote-label";
import { CreateComment } from "~/app/components/comments/create-comment";
import { ViewComment } from "~/app/components/comments/view-comment";
import { DetailsCard } from "~/app/components/details-card";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { ProposalTypeLabel } from "~/app/components/proposal/proposal-type-label";
import { ProposalVoteCard } from "~/app/components/proposal/proposal-vote-card";
import { RewardLabel } from "~/app/components/proposal/reward-label";
import { VoterList } from "~/app/components/proposal/voter-list";
import { VoteData } from "~/app/components/vote-data";
import { handleCustomProposal } from "../../../../utils";
import { StatusLabel } from "../../../components/status-label";

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

export function ProposalExpandedView(props: CustomContent): JSX.Element {
  const { paramId } = props;
  const { selectedAccount, proposalsWithMeta, isProposalsLoading, lastBlock } =
    useTorus();

  const content = useMemo(() => {
    const proposal = proposalsWithMeta?.find(
      (proposal) => proposal.id === paramId,
    );
    if (!proposal) return null;

    const { body, netuid, title, invalid } = handleCustomProposal(proposal);

    const voted = handleUserVotes({
      proposalStatus: proposal.status,
      selectedAccountAddress: selectedAccount?.address as SS58Address,
    });

    return {
      body,
      title,
      netuid,
      invalid,
      id: proposal.id,
      status: proposal.status,
      data: proposal.data,
      author: proposal.proposer,
      expirationBlock: proposal.expirationBlock,
      creationBlock: proposal.creationBlock,
      voted,
    };
  }, [proposalsWithMeta, paramId, selectedAccount]);

  if (isProposalsLoading || !proposalsWithMeta)
    return (
      <div className="flex h-full w-full items-center justify-center lg:h-auto">
        <h1 className="text-2xl text-white">Loading...</h1>
        <LoaderCircle className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  if (!content) return <div>No content found.</div>;

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-row items-center gap-2">
        <ProposalTypeLabel proposalType={content.data} />
        <StatusLabel status={content.status} />
        <RewardLabel proposalId={content.id} result={content.status} />
      </div>
      <div className="flex w-full gap-10">
        <div className="flex h-full w-full flex-col gap-14 md:w-2/3">
          <ExpandedViewContent body={content.body} title={content.title} />

          {/* Mobile Details Section */}
          <div className="flex w-full flex-col gap-6 transition-all md:hidden">
            <DetailsCard
              author={content.author}
              id={content.id}
              creationBlock={content.creationBlock}
              expirationBlock={content.expirationBlock}
              lastBlockNumber={lastBlock?.blockNumber ?? 0}
            />
            <ProposalVoteCard
              proposalId={content.id}
              proposalStatus={content.status}
              voted={content.voted}
            />
            <VoteData proposalStatus={content.status} />
          </div>

          {/* Desktop Proposal Vote Card */}
          <div className="hidden md:block">
            <ProposalVoteCard
              proposalId={content.id}
              proposalStatus={content.status}
              voted={content.voted}
            />
          </div>

          {/* Comments Section */}
          <ViewComment modeType="PROPOSAL" proposalId={content.id} />
          <CreateComment proposalId={content.id} ModeType="PROPOSAL" />

          {/* Desktop Voter List */}
          <div className="hidden lg:block">
            <VoterList proposalStatus={content.status} />
          </div>
        </div>

        {/* Right Column */}
        <div className="hidden flex-col gap-6 transition-all md:flex xl:w-1/3">
          <DetailsCard
            author={content.author}
            id={content.id}
            creationBlock={content.creationBlock}
            expirationBlock={content.expirationBlock}
            lastBlockNumber={lastBlock?.blockNumber ?? 0}
          />
          <VoteData proposalStatus={content.status} />
        </div>
      </div>
    </div>
  );
}
