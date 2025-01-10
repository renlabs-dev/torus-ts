"use client";

import { LoaderCircle } from "lucide-react";

import { CreateComment } from "~/app/components/comments/create-comment";
import { ViewComment } from "~/app/components/comments/view-comment";
import { AgentApplicationVoteTypeCard } from "~/app/components/agent-application/agent-application-vote-card";
import { DetailsCard } from "~/app/components/details-card";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { useGovernance } from "~/context/governance-provider";
import { handleCustomAgentApplications } from "../../../../../utils";
import { DaoStatusLabel } from "~/app/components/agent-application/agent-application-status-label";
import { api } from "~/trpc/react";

interface CustomContent {
  paramId: number;
}

export function AgentApplicationExpandedView(
  props: CustomContent,
): JSX.Element {
  const { paramId } = props;

  const { agentApplicationsWithMeta, agentApplications, lastBlock, selectedAccount } =
    useGovernance();

  const handleAgentApplicationsContent = () => {
    const app = agentApplicationsWithMeta?.find((d) => d.id === paramId);
    if (!app) return null;

    const { body, title } = handleCustomAgentApplications(
      app.id,
      app.customData ?? null,
    );

    const agentApplicationContent = {
      body,
      title,
      author: app.payerKey,
      id: app.id,
      // creationBlock: app.blockNumber,
      expiresAt: app.expiresAt,
      status: "Pending" as const,
    };

    console.log(agentApplicationContent.status);
    return agentApplicationContent;
  };

  const content = handleAgentApplicationsContent();

  if (agentApplications.isLoading || !content)
    return (
      <div className="flex w-full items-center justify-center lg:h-[calc(100svh-203px)]">
        <h1 className="text-2xl text-white">Loading...</h1>
        <LoaderCircle className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const proposalVoteCardProps = {
    proposalId: content.id,
    proposalStatus: content.status,
  };

  const detailsCardProps = {
    author: content.author,
    id: content.id,
    expirationBlock: content.expiresAt,
    lastBlockNumber: lastBlock.data?.blockNumber ?? 0,
  };

  const { data: cadreUsers } = api.cadre.all.useQuery();
  const userIsCuratorDaoMember = cadreUsers?.some((user) => user.userKey === selectedAccount?.address);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-row items-center gap-2">
        <DaoStatusLabel status={content.status} />
      </div>
      <div className="flex w-full justify-between gap-10">
        <div className="flex h-full w-full flex-col gap-14 md:w-2/3">
          <ExpandedViewContent body={content.body} title={content.title} />

          {/* Mobile Details Section */}
          <div className="flex w-full flex-col gap-6 transition-all md:hidden">
            <DetailsCard {...detailsCardProps} />

            <AgentApplicationVoteTypeCard
              applicationId={content.id}
              applicationStatus={content.status}
            />
            {/* <VoteData proposalStatus={content.status} /> */}
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
          {userIsCuratorDaoMember && <CreateComment id={content.id} itemType="AGENT_APPLICATION" />}

          {/* Desktop Voter List */}
          <div className="hidden lg:block">
            {/* <VoterList proposalStatus={content.status} /> */}
          </div>
        </div>

        {/* Right Column */}
        <div className="hidden flex-col gap-6 transition-all md:flex lg:w-1/3">
          <DetailsCard {...detailsCardProps} />
          {/* <VoteData proposalStatus={content.status} /> */}
        </div>
      </div>
    </div>
  );
}
