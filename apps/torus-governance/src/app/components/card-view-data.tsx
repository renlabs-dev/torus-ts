import { Clock, Crown } from "lucide-react";

import type { SS58Address } from "@torus-ts/subspace/address";
import type {
  DaoApplicationStatus,
  ProposalData,
  ProposalStatus,
} from "@torus-ts/subspace/old";
import { getExpirationTime } from "@torus-ts/subspace/old";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@torus-ts/ui";
import { smallAddress } from "@torus-ts/utils/subspace";

import type { VoteStatus } from "./vote-label";
import { calcProposalFavorablePercent } from "~/utils";
import { DaoStatusLabel } from "./dao/dao-status-label";
import { ProposalTypeLabel } from "./proposal/proposal-type-label";
import { StatusLabel } from "./status-label";
import { VoteLabel } from "./vote-label";

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

const VotePercentageBar = (props: {
  proposalStatus: ProposalCardProps["proposalStatus"];
}) => {
  const { proposalStatus } = props;

  if (!proposalStatus) return null;

  const favorablePercent = calcProposalFavorablePercent(proposalStatus);

  if (favorablePercent === null) {
    return (
      <div className="flex w-full animate-pulse justify-between">
        <Skeleton className="w-full !rounded-full py-4" />
      </div>
    );
  }

  const againstPercent = 100 - favorablePercent;
  return (
    <div className="relative h-8 w-full overflow-hidden rounded-full bg-accent">
      <div
        className="h-full rounded-full rounded-r-none bg-muted"
        style={{ width: `${favorablePercent}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-3 text-sm">
        <div className="flex items-center gap-2">
          Favorable
          <span className="text-muted-foreground">
            {favorablePercent.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          Against
          <span className="text-muted-foreground">
            {againstPercent.toFixed(2)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export function CardViewData(props: ProposalCardProps): JSX.Element {
  const {
    voted,
    title,
    author,
    proposalType,
    proposalStatus,
    daoStatus,
    expirationBlock,
    currentBlock,
  } = props;

  return (
    <>
      <Card className="p-6 hover:bg-accent/70">
        <CardHeader className="flex flex-row justify-between px-0 pb-4 pt-0">
          <div className="flex w-fit items-center gap-5">
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

          {proposalStatus && (
            <VotePercentageBar proposalStatus={proposalStatus} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
