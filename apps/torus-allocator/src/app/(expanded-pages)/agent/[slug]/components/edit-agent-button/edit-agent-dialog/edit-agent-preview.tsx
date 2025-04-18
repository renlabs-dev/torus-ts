"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Card } from "@torus-ts/ui/components/card";
import { DialogFooter } from "@torus-ts/ui/components/dialog";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AgentCardContent } from "~/app/_components/agent-item-card/components/agent-card-content";
import { AgentCardFooter } from "~/app/_components/agent-item-card/components/agent-card-footer";
import { AgentCardHeader } from "~/app/_components/agent-item-card/components/agent-card-header";
import { CardHoverEffect } from "~/app/_components/agent-item-card/components/card-hover-effect";
import type {
  EditAgentFormData,
  MetadataType,
  UpdateAgentMutation,
} from "./edit-agent-form-schema";

interface EditAgentPreviewProps {
  agentKey: string;
  updateAgentMutation: UpdateAgentMutation;
  setActiveTab: (tab: string) => void;
  form?: ReturnType<typeof useForm<EditAgentFormData>>;
  metadata: MetadataType;
  icon: string;
}

export function EditAgentPreview({
  agentKey,
  updateAgentMutation,
  setActiveTab,
  form,
  metadata,
  icon,
}: EditAgentPreviewProps) {
  console.log("icon", icon);
  console.log("metadata", metadata);

  const previewCardProps = {
    id: 0,
    name: form?.watch("name"),
    agentKey,
    metadataUri: "",
    registrationBlock: null,
    percComputedWeight: 0.05,
    weightFactor: 1.0,
  };

  return (
    <>
      <div className="mx-auto max-w-md my-6">
        <Card
          className="to-background group relative border bg-gradient-to-tr from-zinc-900 transition
            duration-300 hover:border-white hover:shadow-2xl"
        >
          <AgentCardHeader {...previewCardProps} />
          <AgentCardContent
            metadataUri={previewCardProps.metadataUri}
            metadata={previewCardProps as any}
          />
        </Card>
      </div>
    </>
  );
}
