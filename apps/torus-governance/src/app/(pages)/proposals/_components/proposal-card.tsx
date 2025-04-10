"use client";

import type {
  ProposalData,
  ProposalStatus,
  SS58Address,
} from "@torus-network/sdk";
import type { VoteStatus } from "~/utils/types";
import { AuthorInfo } from "../../../_components/dao-card/components/author-info";
import { ExpirationInfo } from "../../../_components/dao-card/components/expiration-info";
import { ProposalVotePercentageBar } from "../../../_components/dao-card/components/proposal-vote-percentage-bar";
import { DaoCard } from "../../../_components/dao-card/index";
import { ProposalStatusLabel } from "../../../_components/proposal/proposal-status-label";
import { ProposalTypeLabel } from "../../../_components/proposal/proposal-type-label";
import { ProposalVoteLabel } from "../../../_components/proposal/proposal-vote-label";

export interface ProposalCardProps {
  title: string | null;
  author: SS58Address;
  proposalStatus?: ProposalStatus;
  proposalType?: ProposalData;
  voted?: VoteStatus;
  expirationBlock?: number;
  currentBlock?: number;
}

export function ProposalCard({
  title,
  author,
  proposalStatus,
  proposalType,
  voted,
  expirationBlock,
  currentBlock,
}: Readonly<ProposalCardProps>) {
  const isProposalOpen = proposalStatus && "Open" in proposalStatus;

  // Generate top-right content (status labels)
  const topRightContent = (
    <>
      {voted && <ProposalVoteLabel vote={voted} />}
      {proposalStatus && <ProposalStatusLabel status={proposalStatus} />}
      {proposalType && <ProposalTypeLabel proposalType={proposalType} />}
    </>
  );

  // Generate meta content (author, expiration)
  const metaContent = (
    <>
      <AuthorInfo author={author} />
      {expirationBlock && (
        <ExpirationInfo
          expirationBlock={expirationBlock}
          currentBlock={currentBlock}
        />
      )}
    </>
  );

  return (
    <DaoCard
      title={title}
      topRightContent={topRightContent}
      metaContent={metaContent}
    >
      {isProposalOpen && (
        <ProposalVotePercentageBar proposalStatus={proposalStatus} />
      )}
    </DaoCard>
  );
}
