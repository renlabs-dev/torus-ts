"use client";

import { Alert, AlertDescription } from "@torus-ts/ui/components/alert";
import { Card } from "@torus-ts/ui/components/card";
import { AlertCircle } from "lucide-react";
import type { useForm } from "react-hook-form";
import { AgentCardContent } from "~/app/_components/agent-item-card/components/agent-card-content";
import { AgentCardHeader } from "~/app/_components/agent-item-card/components/agent-card-header";
import { api } from "~/trpc/react";
import type { EditAgentFormData } from "./edit-agent-form-schema";

interface EditAgentPreviewProps {
  agentKey: string;
  form: ReturnType<typeof useForm<EditAgentFormData>>;
}

export function EditAgentPreview({ agentKey, form }: EditAgentPreviewProps) {
  const { data: agent, isLoading } = api.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    {
      enabled: !!agentKey,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
    },
  );

  if (isLoading) {
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

  if (!agent?.metadataUri) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Unable to load agent metadata. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const previewImage = form.watch("imageUrl");
  const formValues = form.getValues();

  const agentCardHeaderProps = {
    name: formValues.name,
    agentKey,
    metadataUri: agent.metadataUri,
    registrationBlock: agent.registrationBlock,
    percComputedWeight: null,
    weightFactor: agent.weightFactor,
    previewMetadata: {
      title: formValues.title,
      socials: {
        discord: formValues.socials.discord,
        twitter: formValues.socials.twitter,
        github: formValues.socials.github,
        telegram: formValues.socials.telegram,
      },
      website: formValues.website,
      icon: previewImage,
    },
  };

  return (
    <div className="mx-auto max-w-lg my-6">
      <div className="relative">
        <div
          className="absolute -inset-1 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg blur
            opacity-25"
        ></div>
        <Card
          className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition
            duration-300 hover:border-white hover:shadow-lg pointer-events-none"
        >
          <AgentCardHeader {...agentCardHeaderProps} />
          <AgentCardContent
            metadataUri={agent.metadataUri}
            shortDescription={formValues.shortDescription}
          />
        </Card>
      </div>
    </div>
  );
}
