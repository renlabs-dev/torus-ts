"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { EditAgentButtonContent } from "../edit-agent-button.shared";
import { EditAgentTabs } from "./edit-agent-tabs";
import type {
  AgentType,
  EditAgentFormData,
  MetadataType,
} from "./edit-agent-form-schema";
import { editAgentSchema } from "./edit-agent-form-schema";

export interface EditAgentDialogProps {
  agentKey: string;
  agent: AgentType;
  metadata: MetadataType;
  icon?: Blob;
}

export function EditAgentDialog({
  agentKey,
  agent,
  metadata,
  icon,
}: EditAgentDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<EditAgentFormData>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: {
      name: agent.name ?? "",
      title: metadata.title ?? "",
      shortDescription: metadata.short_description ?? "",
      description: metadata.description ?? "",
      website: metadata.website ?? "",
      apiUrl: agent.apiUrl ?? "",
      imageUrl: metadata.image_url ?? "",
      twitter: metadata.socials?.twitter ?? "",
      github: metadata.socials?.github ?? "",
      telegram: metadata.socials?.telegram ?? "",
      discord: metadata.socials?.discord ?? "",
    },
  });

  const updateAgentMutation = {
    isPending: false,
    mutate: (data: EditAgentFormData) => {
      console.log("Updating agent with data:", data);

      const _socials = {
        twitter: data.twitter,
        github: data.github,
        telegram: data.telegram,
        discord: data.discord,
      };

      toast({
        title: "Success!",
        description: "Agent information updated successfully.",
      });

      setIsOpen(false);
    },
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="flex w-full items-center gap-1.5 p-3 border-green-500 text-green-500 opacity-65
            transition duration-200 hover:text-green-500 hover:opacity-100"
        >
          <EditAgentButtonContent />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[60vh] overflow-y-auto">
        <EditAgentTabs
          agentKey={agentKey}
          metadata={metadata}
          icon={icon}
          form={form}
          updateAgentMutation={updateAgentMutation}
        />
      </DialogContent>
    </Dialog>
  );
}
