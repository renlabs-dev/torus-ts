"use client";

import { Card } from "@torus-ts/ui/components/card";
import type { useForm } from "react-hook-form";
import { AgentCardContent } from "~/app/_components/agent-item-card/components/agent-card-content";
import { AgentCardHeader } from "~/app/_components/agent-item-card/components/agent-card-header";
import type { EditAgentFormData } from "./edit-agent-form-schema";

interface EditAgentPreviewProps {
  agentKey: string;
  form: ReturnType<typeof useForm<EditAgentFormData>>;
}

export function EditAgentPreview({ agentKey, form }: EditAgentPreviewProps) {
  const previewCardProps = {
    id: 0,
    name: form.watch("name"),
    agentKey,
    metadataUri: "",
    registrationBlock: null,
    percComputedWeight: 0.05,
    weightFactor: 1.0,
  };

  console.log("SHORT", form.getValues());

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
            shortDescription={form.watch("shortDescription")}
          />
        </Card>
      </div>
    </>
  );
}
