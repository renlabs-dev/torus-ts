"use client";

import { AgentActivityLabel } from "./agent-application/agent-activity-label";
import { AgentApplicationVoteLabel } from "./agent-application/agent-application-vote-label";
import type { AgentApplicationVoteType } from "./agent-application/agent-application-vote-label";
import { AgentStatusLabel } from "./agent-application/agent-status-label";
import { ProposalTypeLabel } from "./proposal/proposal-type-label";
import { StatusLabel } from "./status-label";
import type { VoteStatus } from "./vote-label";
import { VoteLabel } from "./vote-label";
import { VotePercentageBar } from "./vote-percentage-bar";
import type {
  AgentApplication,
  ProposalData,
  ProposalStatus,
  SS58Address,
} from "@torus-ts/subspace";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { getExpirationTime } from "@torus-ts/utils";
import { smallAddress } from "@torus-ts/utils/subspace";
import { Clock, Crown } from "lucide-react";

export interface ProposalCardProps {
  author: SS58Address;
  expirationBlock?: number;
  currentBlock?: number;
  proposalStatus?: ProposalStatus;
  agentApplicationStatus?: AgentApplication["status"];
  activeAgent?: boolean;
  // favorablePercent?: number | null;
  proposalType?: ProposalData;
  title: string | null;
  voted?: VoteStatus;
  agentVoted?: AgentApplicationVoteType;
}

export function CardViewData(props: Readonly<ProposalCardProps>) {
  const {
    voted,
    agentVoted,
    title,
    author,
    proposalType,
    proposalStatus,
    expirationBlock,
    currentBlock,
    agentApplicationStatus,
    activeAgent,
  } = props;

  const isProposalOpen = proposalStatus && "Open" in proposalStatus;
  return (
    <Card className="animate-fade-down hover:bg-accent w-full p-4 transition duration-500 lg:p-6">
      <CardHeader className="flex flex-col-reverse justify-between space-y-0 px-0 pb-3 pt-0 md:flex-col-reverse xl:flex-row">
        <div className="flex w-fit flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-5">
          <span className="text-muted-foreground line-clamp-1 flex w-fit items-center gap-1.5 truncate text-sm">
            <Crown size={14} />
            {smallAddress(author)}
          </span>

          {expirationBlock && (
            <span className="text-muted-foreground line-clamp-1 flex w-fit items-center gap-1.5 truncate text-sm">
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
          {agentVoted && <AgentApplicationVoteLabel vote={agentVoted} />}

          {proposalType && <ProposalTypeLabel proposalType={proposalType} />}

          {proposalStatus && <StatusLabel status={proposalStatus} />}
          {activeAgent && <AgentActivityLabel />}
          {agentApplicationStatus && (
            <AgentStatusLabel status={agentApplicationStatus} />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-0 py-0">
        {title && (
          <CardTitle className="line-clamp-3 text-xl font-semibold text-white lg:pb-0 xl:line-clamp-2">
            {title}
          </CardTitle>
        )}

        {isProposalOpen && (
          <VotePercentageBar proposalStatus={proposalStatus} />
        )}
      </CardContent>
    </Card>
  );
}
