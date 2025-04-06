"use client";

import type { AgentApplication, SS58Address } from "@torus-network/sdk";
import { AgentActivityLabel } from "../../../_components/agent-application/agent-activity-label";
import { AgentApplicationVoteLabel } from "../../../_components/agent-application/agent-application-vote-label";
import type { AgentApplicationVoteType } from "../../../_components/agent-application/agent-application-vote-label";
import { AgentApplicationVotePercentageBar } from "../../../_components/agent-application/agent-application-vote-percentage-bar";
import { AgentStatusLabel } from "../../../_components/agent-application/agent-status-label";
import { AuthorInfo } from "../../../_components/dao-card/components/author-info";
import { DaoCard } from "../../../_components/dao-card/index";

export interface AgentApplicationCardProps {
  title: string | null;
  author: SS58Address;
  agentApplicationStatus?: AgentApplication["status"];
  activeAgent?: boolean;
  agentVoted?: AgentApplicationVoteType;
  agentApplicationId?: number;
  whitelistStatus?: string;
}

export function AgentApplicationCard({
  title,
  author,
  agentApplicationStatus,
  activeAgent,
  agentVoted,
  agentApplicationId,
  whitelistStatus,
}: Readonly<AgentApplicationCardProps>) {
  // Generate top-right content (status labels)
  const topRightContent = (
    <>
      {agentVoted && <AgentApplicationVoteLabel vote={agentVoted} />}
      {activeAgent && <AgentActivityLabel />}
      {agentApplicationStatus && (
        <AgentStatusLabel status={agentApplicationStatus} />
      )}
    </>
  );

  // Generate meta content (author)
  const metaContent = <AuthorInfo author={author} />;

  return (
    <DaoCard
      title={title}
      topRightContent={topRightContent}
      metaContent={metaContent}
    >
      {agentApplicationId && (
        <AgentApplicationVotePercentageBar
          applicationId={agentApplicationId}
          whitelistStatus={whitelistStatus}
        />
      )}
    </DaoCard>
  );
}
