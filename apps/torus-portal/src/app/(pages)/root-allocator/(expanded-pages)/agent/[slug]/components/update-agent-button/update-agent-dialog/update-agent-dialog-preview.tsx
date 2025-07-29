"use client";

import { AgentCard } from "@torus-ts/ui/components/agent-card/agent-card";
import { AgentItemSkeleton } from "@torus-ts/ui/components/agent-card/agent-card-skeleton-loader";

import { useBlobUrl } from "~/hooks/use-blob-url";
import { api } from "~/trpc/react";

import type { UpdateAgentForm } from "./update-agent-dialog-form-schema";

interface UpdateAgentDialogPreviewProps {
  agentKey: string;
  form: UpdateAgentForm;
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

  const formValues = form.getValues();
  const previewImage = form.watch("imageFile");
  const previewImageBlobUrl = useBlobUrl(previewImage);

  if (isLoading || !agent) {
    return (
      <div className="mx-auto max-w-lg my-6">
        <AgentItemSkeleton />
      </div>
    );
  }

  const socials: Record<string, string> = {};
  if (formValues.socials.discord) socials.discord = formValues.socials.discord;
  if (formValues.socials.twitter) socials.twitter = formValues.socials.twitter;
  if (formValues.socials.github) socials.github = formValues.socials.github;
  if (formValues.socials.telegram)
    socials.telegram = formValues.socials.telegram;
  if (formValues.website) socials.website = formValues.website;

  return (
    <div className="mx-auto max-w-lg my-6">
      <div className="relative pointer-events-none">
        <AgentCard
          name={formValues.name ?? ""}
          agentKey={agentKey}
          iconUrl={previewImageBlobUrl}
          shortDescription={formValues.shortDescription}
          socials={socials}
          website={formValues.website}
          percComputedWeight={null}
          showHoverEffect={false}
        />
      </div>
    </div>
  );
}
