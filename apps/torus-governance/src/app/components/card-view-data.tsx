"use client";

import { CardHeader, CardContent, Card, CardTitle } from "@torus-ts/ui";
import { Clock, Crown } from "lucide-react";
import { DaoStatusLabel } from "./dao/dao-status-label";
import { ProposalTypeLabel } from "./proposal/proposal-type-label";
import { getExpirationTime, smallAddress } from "@torus-ts/utils";
import { StatusLabel } from "./status-label";
import { VoteLabel } from "./vote-label";
import type { DaoApplicationStatus, ProposalData, ProposalStatus, SS58Address } from "@torus-ts/types";
import type { VoteStatus } from "./vote-label";

export interface ProposalCardProps {
  author: SS58Address;
  daoStatus?: DaoApplicationStatus;
  expirationBlock?: number;
  currentBlock?: number;
  proposalStatus?: ProposalStatus;
  proposalType?: ProposalData;
  title: string | null;
  voted?: VoteStatus;
}

const VotePercentageBar = () => {
  return (
    <div className="flex justify-between w-full">
      <span className="flex items-center justify-start w-1/2 gap-2 px-3 py-1 text-sm text-left rounded-r-none bg-muted rounded-xl">
        Favorable
        <span className="text-muted-foreground">
          50.0%
        </span>
      </span>
      <span className="flex items-center justify-end w-1/2 gap-2 px-3 py-1 text-sm text-right rounded-l-none rounded-xl bg-accent">
        Against
        <span className="text-muted-foreground">
          50.0%
        </span>
      </span>
    </div>
  )
}

export function CardViewData(props: ProposalCardProps): JSX.Element {
  const { voted, title, author, proposalType, proposalStatus, daoStatus, expirationBlock, currentBlock } = props;

  return (
    <>
      <Card className="p-6 hover:bg-accent/70">
        <CardHeader className="flex flex-row justify-between px-0 pt-0 pb-4">
          <div className="flex items-center gap-5 w-fit">
            <span className="line-clamp-1 flex items-center gap-1.5 w-fit truncate text-sm text-muted-foreground">
              <Crown size={14} />
              {smallAddress(author)}
            </span>

            {expirationBlock && (
              <span className="line-clamp-1 flex items-center gap-1.5 w-fit truncate text-sm text-muted-foreground">
                <Clock size={14} />
                Ends {getExpirationTime(currentBlock, expirationBlock, true)}
              </span>
            )}

          </div>
          <div className="flex gap-2">
            {voted && <VoteLabel vote={voted} />}

            {proposalType && (
              <ProposalTypeLabel proposalType={proposalType} />
            )}

            {proposalStatus && (
              <StatusLabel status={proposalStatus} />
            )}
            {daoStatus && (
              <DaoStatusLabel status={daoStatus} />
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-3 px-0 py-0">
          {title && (
            <CardTitle className="text-xl font-semibold text-white lg:pb-0">
              {title}
            </CardTitle>
          )}
          <VotePercentageBar />
        </CardContent >
      </Card >
    </>
  );
}
