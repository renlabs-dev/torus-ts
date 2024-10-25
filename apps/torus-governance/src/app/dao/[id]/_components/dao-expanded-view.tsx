"use client";

import { ArrowPathIcon } from "@heroicons/react/20/solid";

import type { DaoApplicationStatus } from "@torus-ts/types";
import { useTorus } from "@torus-ts/providers/use-torus";
import { MarkdownView } from "@torus-ts/ui/markdown-view";
import { smallAddress } from "@torus-ts/utils";

import { CreateComment } from "~/app/components/comments/create-comment";
import { ViewComment } from "~/app/components/comments/view-comment";
import { CreateCadreCandidates } from "~/app/components/dao/create-cadre-candidates";
import { DaoStatusLabel } from "~/app/components/dao/dao-status-label";
import { DaoVoteCard } from "~/app/components/dao/dao-vote-card";
import { SectionHeaderText } from "~/app/components/section-header-text";
import { handleCustomDaos } from "../../../../utils";

interface CustomContent {
  paramId: number;
}

export function DaoExpandedView(props: CustomContent): JSX.Element {
  const { paramId } = props;

  const { daosWithMeta, isDaosLoading } = useTorus();

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
    };
    return daoContent;
  }

  const content = handleDaosContent();

  if (isDaosLoading || !content)
    return (
      <div className="flex w-full items-center justify-center lg:h-[calc(100svh-203px)]">
        <h1 className="text-2xl text-white">Loading...</h1>
        <ArrowPathIcon className="ml-2 animate-spin" color="#FFF" width={20} />
      </div>
    );

  return (
    <div className="flex w-full flex-col md:flex-row">
      <div className="flex h-full w-full flex-col lg:w-2/3">
        <div className="m-2 flex h-full animate-fade-down flex-col border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-100 md:max-h-[60vh] md:min-h-[50vh]">
          <SectionHeaderText
            text={content.title ?? "No Custom Metadata Title"}
          />
          <div className="h-full lg:overflow-auto">
            <MarkdownView source={(content.body as string | undefined) ?? ""} />
          </div>
        </div>
        <div className="w-full">
          <ViewComment modeType="DAO" proposalId={content.id} />
        </div>
        <div className="m-2 hidden h-fit min-h-max animate-fade-down flex-col items-center justify-between border border-white/20 bg-[#898989]/5 p-6 text-white backdrop-blur-md animate-delay-200 md:flex">
          <CreateComment proposalId={content.id} ModeType="DAO" />
        </div>
      </div>

      <div className="flex flex-col lg:w-1/3">
        <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-200">
          <div className="flex flex-col gap-3">
            <div>
              <span className="text-gray-500">ID</span>
              <span className="flex items-center text-white">{content.id}</span>
            </div>

            <div>
              <span className="text-gray-500">Author</span>
              <span className="flex items-center text-white">
                {smallAddress(content.author, 16)}
              </span>
            </div>
          </div>
        </div>

        <div className="m-2 animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-200">
          <div className="flex items-center gap-3">
            <DaoStatusLabel
              daoStatus={content.status as DaoApplicationStatus}
            />
          </div>
        </div>

        <div className="m-2 hidden animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-500 md:block">
          <DaoVoteCard
            daoId={content.id}
            daoStatus={content.status as DaoApplicationStatus}
          />
        </div>

        <div className="m-2 hidden animate-fade-down border border-white/20 bg-[#898989]/5 p-6 text-gray-400 backdrop-blur-md animate-delay-700 md:block">
          <CreateCadreCandidates />
        </div>
      </div>
    </div>
  );
}
