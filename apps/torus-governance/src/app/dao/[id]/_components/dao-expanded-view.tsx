"use client";

import { LoaderCircle } from "lucide-react";

import { CreateComment } from "~/app/components/comments/create-comment";
import { ViewComment } from "~/app/components/comments/view-comment";
import { CreateCadreCandidates } from "~/app/components/agent-application/create-cadre-candidates";
import { DaoStatusLabel } from "~/app/components/agent-application/agent-application-status-label";
import { AgentApplicationVoteTypeCard } from "~/app/components/agent-application/agent-application-vote-card";
import { DetailsCard } from "~/app/components/details-card";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { useGovernance } from "~/context/governance-provider";
import { handleCustomDaos } from "../../../../utils";

interface CustomContent {
  paramId: number;
}

export function DaoExpandedView(props: CustomContent): JSX.Element {
  const { paramId } = props;

  const { daosWithMeta, daos, lastBlock } = useGovernance();

  function handleDaosContent() {
    const dao = daosWithMeta?.find((d) => d.id === paramId);
    if (!dao) return null;

    const { body, title } = handleCustomDaos(dao.id, dao.customData ?? null);

    const daoContent = {
      body,
      title,
      status: dao.status,
      author: dao.userId,
      id: dao.id,
      creationBlock: dao.blockNumber,
    };
    return daoContent;
  }

  const content = handleDaosContent();

  if (daos.isLoading || !content)
    return (
      <div className="flex w-full items-center justify-center lg:h-[calc(100svh-203px)]">
        <h1 className="text-2xl text-white">Loading...</h1>
        <LoaderCircle className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

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
            <DetailsCard
              author={content.author}
              id={content.id}
              creationBlock={content.creationBlock}
              lastBlockNumber={lastBlock.data?.blockNumber ?? 0}
            />
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
          <CreateComment id={content.id} itemType="AGENT_APPLICATION" />

          {/* Desktop Voter List */}
          <div className="hidden lg:block">
            {/* <VoterList proposalStatus={content.status} /> */}
          </div>
        </div>

        {/* Right Column */}
        <div className="hidden flex-col gap-6 transition-all md:flex lg:w-1/3">
          <DetailsCard
            author={content.author}
            id={content.id}
            creationBlock={content.creationBlock}
            lastBlockNumber={lastBlock.data?.blockNumber ?? 0}
          />
          <CreateCadreCandidates />
          {/* <VoteData proposalStatus={content.status} /> */}
        </div>
      </div>
    </div>
  );
}
