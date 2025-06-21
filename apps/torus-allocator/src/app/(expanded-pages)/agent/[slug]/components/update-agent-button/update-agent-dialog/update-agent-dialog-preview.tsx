"use client";

import { Card } from "@torus-ts/ui/components/card";
import { AgentCardContent } from "~/app/_components/agent-card/components/agent-card-content";
import type { AgentHeaderProps } from "~/app/_components/agent-card/components/agent-card-header";
import { AgentCardHeader } from "~/app/_components/agent-card/components/agent-card-header";
import { api } from "~/trpc/react";
import type { UpdateAgentForm } from "./update-agent-dialog-form-schema";

interface UpdateAgentDialogPreviewProps {
  agentKey: string;
  form: UpdateAgentForm;
}

function AgentPreviewSkeleton() {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-pulse flex flex-col items-center space-y-4">
        <div className="rounded-full bg-slate-200 h-16 w-16"></div>
        <div className="h-4 bg-slate-200 rounded w-3/4"></div>
        <div className="h-4 bg-slate-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}

export function UpdateAgentDialogPreview({
  agentKey,
  form,
}: UpdateAgentDialogPreviewProps) {
  const { data: agent, isLoading } = api.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    {
      enabled: !!agentKey,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  );

  if (isLoading || !agent?.metadataUri) {
    return <AgentPreviewSkeleton />;
  }

  const formValues = form.getValues();
  const previewImage = form.watch("imageUrl");

  const headerProps: AgentHeaderProps = {
    name: formValues.name,
    agentKey,
    metadataUri: agent.metadataUri,
    registrationBlock: agent.registrationBlock,
    percComputedWeight: null,
    weightFactor: agent.weightFactor,
    previewMode: true,
    previewData: {
      title: formValues.title,
      socials: {
        discord: formValues.socials.discord,
        twitter: formValues.socials.twitter,
        github: formValues.socials.github,
        telegram: formValues.socials.telegram,
      },
      website: formValues.website,
      iconUrl: previewImage ?? undefined,
    },
  };

  return (
    <div className="mx-auto max-w-lg my-6">
      <div className="relative">
        <Card
          className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition
            duration-300 hover:border-white hover:shadow-lg pointer-events-none"
        >
          <AgentCardHeader {...headerProps} />
          <AgentCardContent
            metadataUri={agent.metadataUri}
            shortDescription={formValues.shortDescription}
          />
        </Card>
      </div>
    </div>
  );
}
