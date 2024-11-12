import { CardHeader, CardContent, Card, CardTitle, Skeleton } from "@torus-ts/ui";
import { Clock, Crown } from "lucide-react";
import { DaoStatusLabel } from "./dao/dao-status-label";
import { ProposalTypeLabel } from "./proposal/proposal-type-label";
import { getExpirationTime, smallAddress } from "@torus-ts/utils";
import { StatusLabel } from "./status-label";
import { VoteLabel } from "./vote-label";
import type { DaoApplicationStatus, ProposalData, ProposalStatus, SS58Address } from "@torus-ts/types";
import type { VoteStatus } from "./vote-label";
import { calcProposalFavorablePercent } from "~/utils";

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

const VotePercentageBar = (props: {
  proposalStatus: ProposalCardProps["proposalStatus"];
}) => {
  const { proposalStatus } = props;

  if (!proposalStatus) return null

  const favorablePercent = calcProposalFavorablePercent(proposalStatus)

  if (favorablePercent === null) {
    return (
      <div className="flex justify-between w-full animate-pulse">
        <Skeleton className="py-4 w-full !rounded-full" />
      </div>
    )
  }

  const againstPercent = 100 - favorablePercent;
  return (
    <div className="relative w-full h-8 bg-accent rounded-full overflow-hidden ">
      <div
        className="bg-muted h-full rounded-full rounded-r-none "
        style={{ width: `${favorablePercent}%` }}
      />
      <div className="absolute inset-0 flex justify-between items-center px-3 text-sm">
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

          {proposalStatus && <VotePercentageBar proposalStatus={proposalStatus} />}
        </CardContent >
      </Card >
    </>
  );
}
