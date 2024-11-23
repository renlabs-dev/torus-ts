"use client";

import { Clock, Crown } from "lucide-react";

import type { SS58Address } from "@torus-ts/subspace/address";
import type {
  DaoApplicationStatus,
  ProposalData,
  ProposalStatus,
} from "@torus-ts/subspace/old";
import { getExpirationTime } from "@torus-ts/subspace/old";
import { Card, CardContent, CardHeader, CardTitle } from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";

import type { VoteStatus } from "./vote-label";
import { DaoStatusLabel } from "./dao/dao-status-label";
import { ProposalTypeLabel } from "./proposal/proposal-type-label";
import { StatusLabel } from "./status-label";
import { VoteLabel } from "./vote-label";
import { VotePercentageBar } from "./vote-percentage-bar";

export interface ProposalCardProps {
  author: SS58Address;
  daoStatus?: DaoApplicationStatus;
  expirationBlock?: number;
  currentBlock?: number;
  proposalStatus?: ProposalStatus;
  favorablePercent?: number | null;
  proposalType?: ProposalData;
  title: string | null;
  voted?: VoteStatus;
}

export function CardViewData(props: ProposalCardProps): JSX.Element {
  const {
    voted,
    title,
    author,
    proposalType,
    proposalStatus,
    daoStatus,
    favorablePercent,
    expirationBlock,
    currentBlock,
  } = props;

  const isProposalOpen = proposalStatus && "open" in proposalStatus;

  return (
    <>
      <Card className="p-4 hover:bg-accent/70 lg:p-6">
        <CardHeader className="flex flex-col-reverse justify-between space-y-0 px-0 pb-3 pt-0 xl:flex-row">
          <div className="flex w-fit flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5">
            <span className="line-clamp-1 flex w-fit items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Crown size={14} />
              {smallAddress(author)}
            </span>

            {expirationBlock && (
              <span className="line-clamp-1 flex w-fit items-center gap-1.5 truncate text-sm text-muted-foreground">
                <Clock size={14} />
                {currentBlock && currentBlock < expirationBlock
                  ? "Ends"
                  : "Ended"}{" "}
                {getExpirationTime(currentBlock, expirationBlock, true)}
              </span>
            )}
          </div>
          <div className="!mb-4 flex gap-2 xl:!mb-0">
            {voted && <VoteLabel vote={voted} />}

            {proposalType && <ProposalTypeLabel proposalType={proposalType} />}

            {proposalStatus && <StatusLabel status={proposalStatus} />}
            {daoStatus && <DaoStatusLabel status={daoStatus} />}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 px-0 py-0">
          {title && (
            <CardTitle className="line-clamp-3 text-xl font-semibold text-white lg:pb-0 xl:line-clamp-2">
              {title}
            </CardTitle>
          )}

          {isProposalOpen && (
            <VotePercentageBar favorablePercent={favorablePercent} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
