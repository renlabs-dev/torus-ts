"use client";

import type {
  ProposalData,
  ProposalStatus,
  SS58Address,
} from "@torus-network/sdk";
import { AuthorInfo } from "../../../_components/dao-card/components/author-info";
import { ExpirationInfo } from "../../../_components/dao-card/components/expiration-info";
import type { VoteStatus } from "../../../_components/dao-card/components/vote-label";
import { VoteLabel } from "../../../_components/dao-card/components/vote-label";
import { VotePercentageBar } from "../../../_components/dao-card/components/vote-percentage-bar";
import { DaoCard } from "../../../_components/dao-card/index";
import { ProposalTypeLabel } from "../../../_components/proposal/proposal-type-label";
import { StatusLabel } from "../../../_components/status-label";

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
      {voted && <VoteLabel vote={voted} />}
      {proposalType && <ProposalTypeLabel proposalType={proposalType} />}
      {proposalStatus && <StatusLabel status={proposalStatus} />}
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
      {isProposalOpen && <VotePercentageBar proposalStatus={proposalStatus} />}
    </DaoCard>
  );
}
