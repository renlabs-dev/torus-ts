"use client";

import { Card } from "@torus-ts/ui/components/card";
import type { useForm } from "react-hook-form";
import { AgentCardContent } from "~/app/_components/agent-item-card/components/agent-card-content";
import { AgentCardHeader } from "~/app/_components/agent-item-card/components/agent-card-header";
import type { EditAgentFormData } from "./edit-agent-form-schema";
import { api } from "~/trpc/react";

interface EditAgentPreviewProps {
  agentKey: string;
  form: ReturnType<typeof useForm<EditAgentFormData>>;
}

export function EditAgentPreview({ agentKey, form }: EditAgentPreviewProps) {
  const { data: agent } = api.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    {
      enabled: !!agentKey,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  );

  if (!agent?.metadataUri) return null;

  const agentCardHeaderProps = {
    name: form.watch("name"),
    agentKey,
    metadataUri: agent.metadataUri,
    registrationBlock: agent.registrationBlock,
    percComputedWeight: null,
    weightFactor: agent.weightFactor,
    previewMetadata: {
      title: form.watch("title"),
      socials: {
        discord: form.watch("socials.discord"),
        twitter: form.watch("socials.twitter"),
        github: form.watch("socials.github"),
        telegram: form.watch("socials.telegram"),
      },
      website: form.watch("website"),
      icon: form.watch("imageUrl"),
    },
  };

  return (
    <>
      <div className="mx-auto max-w-md my-6">
        <Card
          className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition
            duration-300 hover:border-white hover:shadow-2xl pointer-events-none"
        >
          <AgentCardHeader {...agentCardHeaderProps} />
          <AgentCardContent
            metadataUri={agent.metadataUri}
            shortDescription={form.watch("shortDescription")}
          />
        </Card>
      </div>
    </>
  );
}
