"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { EditAgentButtonContent } from "../edit-agent-button.shared";
import { EditAgentTabs } from "./edit-agent-tabs";
import type { EditAgentFormData } from "./edit-agent-form-schema";
import { editAgentSchema } from "./edit-agent-form-schema";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { api } from "~/trpc/react";

export interface EditAgentDialogProps {
  agentKey: string;
}

export function EditAgentDialog({ agentKey }: EditAgentDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const { data: agent } = api.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    {
      enabled: !!agentKey,
      refetchOnWindowFocus: false,
    },
  );

  const { data: agentMetadata } = useQueryAgentMetadata(
    agent?.metadataUri ?? "",
    {
      fetchImages: true,
      enabled: !!agent?.metadataUri,
    },
  );

  const form = useForm<EditAgentFormData>({
    resolver: zodResolver(editAgentSchema),
    defaultValues: {
      name: "",
      title: "",
      shortDescription: "",
      description: "",
      website: "",
      apiUrl: "",
      socials: {
        twitter: "",
        github: "",
        telegram: "",
        discord: "",
      },
    },
  });

  const resetFormData = useCallback(() => {
    if (!agent && !agentMetadata) return;

    form.reset({
      name: agent?.name ?? "",
      title: agentMetadata?.metadata.title ?? "",
      shortDescription: agentMetadata?.metadata.short_description ?? "",
      description: agentMetadata?.metadata.description ?? "",
      website: agentMetadata?.metadata.website ?? "",
      apiUrl: agent?.apiUrl ?? "",
      socials: {
        twitter: agentMetadata?.metadata.socials?.twitter ?? "",
        github: agentMetadata?.metadata.socials?.github ?? "",
        telegram: agentMetadata?.metadata.socials?.telegram ?? "",
        discord: agentMetadata?.metadata.socials?.discord ?? "",
      },
    });
  }, [form, agent, agentMetadata]);

  useEffect(() => {
    resetFormData();
  }, [resetFormData]);

  useEffect(() => {
    if (isOpen) {
      resetFormData();
    }
  }, [isOpen, resetFormData]);

  const updateAgentMutation = {
    isPending: false,
    mutate: (data: unknown) => {
      const typedData = data as EditAgentFormData;
      console.log("Updating agent with data:", typedData);

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
          form={form}
          updateAgentMutation={updateAgentMutation}
        />
      </DialogContent>
    </Dialog>
  );
}
