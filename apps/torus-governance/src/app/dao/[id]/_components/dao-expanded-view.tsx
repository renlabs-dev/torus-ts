"use client";

import { LoaderCircle } from "lucide-react";

import type { DaoApplicationStatus } from "@torus-ts/subspace/old";
import { useTorus } from "@torus-ts/providers/use-torus";

import { CreateComment } from "~/app/components/comments/create-comment";
import { ViewComment } from "~/app/components/comments/view-comment";
import { CreateCadreCandidates } from "~/app/components/dao/create-cadre-candidates";
import { DaoStatusLabel } from "~/app/components/dao/dao-status-label";
import { DaoVoteCard } from "~/app/components/dao/dao-vote-card";
import { DetailsCard } from "~/app/components/details-card";
import { ExpandedViewContent } from "~/app/components/expanded-view-content";
import { handleCustomDaos } from "../../../../utils";

interface CustomContent {
  paramId: number;
}

export function DaoExpandedView(props: CustomContent): JSX.Element {
  const { paramId } = props;

  const { daosWithMeta, isDaosLoading, lastBlock } = useTorus();

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

  if (isDaosLoading || !content)
    return (
      <div className="flex w-full items-center justify-center lg:h-[calc(100svh-203px)]">
        <h1 className="text-2xl text-white">Loading...</h1>
        <LoaderCircle className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex w-full flex-row items-center gap-2">
        <DaoStatusLabel status={content.status as DaoApplicationStatus} />
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
              lastBlockNumber={lastBlock?.blockNumber ?? 0}
            />
            <DaoVoteCard daoId={content.id} daoStatus={content.status} />
            {/* <VoteData proposalStatus={content.status} /> */}
          </div>

          {/* Desktop Proposal Vote Card */}
          <div className="hidden md:block">
            <DaoVoteCard daoId={content.id} daoStatus={content.status} />
          </div>

          {/* Comments Section */}
          <ViewComment modeType="DAO" id={content.id} />
          <CreateComment id={content.id} ModeType="DAO" />

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
            lastBlockNumber={lastBlock?.blockNumber ?? 0}
          />
          <CreateCadreCandidates />
          {/* <VoteData proposalStatus={content.status} /> */}
        </div>
      </div>
    </div>
  );
}
