"use client";

import { AgentActivityLabel } from "~/app/_components/agent-application/agent-activity-label";
import { AgentApplicationVoteTypeCard } from "~/app/_components/agent-application/agent-application-vote-card";
import { AgentStatusLabel } from "~/app/_components/agent-application/agent-status-label";
import { CreateCadreCandidates } from "~/app/_components/agent-application/create-cadre-candidates";
import { PenaltyManager } from "~/app/_components/agent-application/penalty-manager";
import { VoterList } from "~/app/_components/agent-application/voter-list";
import { CreateComment } from "~/app/_components/comments/create-comment";
import { ViewComment } from "~/app/_components/comments/view-comment";
import { DetailsCard } from "~/app/_components/details-card";
import { ExpandedViewContent } from "~/app/_components/expanded-view-content";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { LoaderCircle } from "lucide-react";
import { handleCustomAgentApplications } from "../../../../../utils";
import { AgentApplicationExpandedVoteBars } from "./agent-application-expanded-vote-bars";

interface CustomContent {
  paramId: number;
}

export function AgentApplicationExpandedView(props: Readonly<CustomContent>) {
  const { paramId } = props;

  const { agentApplicationsWithMeta, agentApplications, lastBlock } =
    useGovernance();
  const {
    data: votersList,
    isLoading: votersListLoading,
    error: votersListError,
  } = api.agentApplicationVote.byApplicationId.useQuery({
    applicationId: paramId,
  });

  const { data: activeAgents } = api.agent.all.useQuery();

  const handleAgentApplicationsContent = () => {
    const app = agentApplicationsWithMeta?.find((d) => d.id === paramId);
    if (!app) return null;

    const { body, title } = handleCustomAgentApplications(
      app.id,
      app.customData ?? null,
    );

    const agentApplicationContent = {
      agentKey: app.agentKey,
      author: app.payerKey,
      body,
      expiresAt: app.expiresAt,
      id: app.id,
      status: app.status,
      title,
    };

    return agentApplicationContent;
  };

  const content = handleAgentApplicationsContent();

  const isAgentRegistered = !!activeAgents?.find(
    (agent) => agent.key === content?.agentKey,
  );

  if (agentApplications.isLoading || !content)
    return (
      <div className="flex w-full items-center justify-center lg:h-[calc(100svh-203px)]">
        <h1 className="text-lg text-white">Loading...</h1>
        <LoaderCircle className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  const detailsCardProps = {
    author: content.author,
    agentKey: content.agentKey,
    id: content.id,
    expirationBlock: content.expiresAt,
    lastBlockNumber: lastBlock.data?.blockNumber ?? 0,
  };

  const votersListProps = {
    isError: !!votersListError,
    isLoading: votersListLoading,
    voters: votersList,
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="animate-fade-down flex w-full flex-row items-center gap-2">
        <AgentStatusLabel status={content.status} />
        {isAgentRegistered && <AgentActivityLabel />}
      </div>

      <div className="animate-fade-down flex w-full flex-col md:flex-row md:justify-between md:gap-8">
        {/* Main Content Column */}
        <div className="flex h-full w-full flex-col gap-8 md:w-2/3 mb-4">
          <ExpandedViewContent body={content.body} title={content.title} />
          <ViewComment itemType="AGENT_APPLICATION" id={content.id} />
          <CreateComment id={content.id} itemType="AGENT_APPLICATION" />
          <VoterList {...votersListProps} />
        </div>

        {/* Right/Bottom Column */}
        <div
          className="flex flex-col gap-4 w-full md:w-1/3 md:animate-fade-down
            md:animate-delay-[1400ms]"
        >
          <CreateCadreCandidates />
          <DetailsCard {...detailsCardProps} />
          <AgentApplicationVoteTypeCard
            applicationId={content.id}
            applicationStatus={content.status}
          />
          <AgentApplicationExpandedVoteBars id={content.id} />
          <PenaltyManager agentKey={content.agentKey} status={content.status} />
        </div>
      </div>
    </div>
  );
}
