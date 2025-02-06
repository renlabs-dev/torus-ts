"use client";

import { AgentActivityLabel } from "~/app/components/agent-application/agent-activity-label";
import { AgentApplicationVoteTypeCard } from "~/app/components/agent-application/agent-application-vote-card";
import { AgentStatusLabel } from "~/app/components/agent-application/agent-status-label";
import { api } from "~/trpc/react";
import { CreateCadreCandidates } from "~/app/components/agent-application/create-cadre-candidates";
import { CreateComment } from "~/app/components/comments/create-comment";
import { DetailsCard } from "~/app/components/details-card";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { handleCustomAgentApplications } from "../../../../../utils";
import { LoaderCircle } from "lucide-react";
import { PenaltyManager } from "~/app/components/agent-application/penalty-manager";
import { useGovernance } from "~/context/governance-provider";
import { ViewComment } from "~/app/components/comments/view-comment";
import { VoterList } from "~/app/components/agent-application/voter-list";

interface CustomContent {
  paramId: number;
}

export function AgentApplicationExpandedView(
  props: CustomContent,
): JSX.Element {
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
        <h1 className="text-2xl text-white">Loading...</h1>
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
      <div className="flex w-full animate-fade-down flex-row items-center gap-2">
        <AgentStatusLabel status={content.status} />
        {isAgentRegistered && <AgentActivityLabel />}
      </div>
      <div className="flex w-full animate-fade-down justify-between gap-10">
        <div className="flex h-full w-full flex-col gap-14 md:w-2/3">
          <ExpandedViewContent body={content.body} title={content.title} />

          {/* Mobile Details Section */}
          <div className="flex w-full flex-col gap-6 transition-all md:hidden">
            <DetailsCard {...detailsCardProps} />

            <AgentApplicationVoteTypeCard
              applicationId={content.id}
              applicationStatus={content.status}
            />
            <CreateCadreCandidates />
            <PenaltyManager
              agentKey={content.agentKey}
              status={content.status}
            />
          </div>

          {/* Desktop Proposal Vote Card */}
          <div className="hidden md:block">
            <AgentApplicationVoteTypeCard
              applicationId={content.id}
              applicationStatus={content.status}
            />
          </div>

          {/* Comments Section */}
          <ViewComment itemType="AGENT_APPLICATION" id={content.id} />
          <CreateComment
            id={content.id}
            author={content.author}
            itemType="AGENT_APPLICATION"
          />
          <VoterList {...votersListProps} />
        </div>

        {/* Right Column */}
        <div className="hidden flex-col gap-6 transition-all md:flex lg:w-1/3">
          <DetailsCard {...detailsCardProps} />
          <CreateCadreCandidates />
          <PenaltyManager agentKey={content.agentKey} status={content.status} />
        </div>
      </div>
    </div>
  );
}
