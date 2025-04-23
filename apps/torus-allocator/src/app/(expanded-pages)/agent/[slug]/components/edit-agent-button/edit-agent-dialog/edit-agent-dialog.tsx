"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { api } from "~/trpc/react";
import { EditAgentButtonContent } from "../edit-agent-button.shared";
import type { EditAgentFormData } from "./edit-agent-form-schema";
import { editAgentSchema } from "./edit-agent-form-schema";
import { EditAgentTabs } from "./edit-agent-tabs";
import {
  cidToIpfsUri,
  getAccountBalance,
  updateAgentOnChain,
  uploadMetadata,
} from "./edit-agent-dialog-util";

export interface EditAgentDialogProps {
  agentKey: string;
}

export function EditAgentDialog({ agentKey }: EditAgentDialogProps) {
  const { toast } = useToast();
  const { updateAgent: updateAgentFunc, selectedAccount } = useTorus();
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [accountFreeBalance, setAccountFreeBalance] = useState(0n);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionResult | null>(null);

  const { data: agent } = api.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    {
      enabled: !!agentKey,
      refetchOnWindowFocus: false,
    },
  );

  console.log("Agent", agent);

  const { data: agentMetadata } = useQueryAgentMetadata(
    agent?.metadataUri ?? "",
    {
      fetchImages: true,
      enabled: !!agent?.metadataUri,
    },
  );

  console.log("Agent metadata", agentMetadata);

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
      setTransactionStatus(null);
    }
  }, [isOpen, resetFormData]);

  useEffect(() => {
    if (!selectedAccount) return;

    const balance = getAccountBalance(selectedAccount);
    setAccountFreeBalance(balance);
  }, [selectedAccount]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const fileUrl = URL.createObjectURL(file);
      form.setValue("imageUrl", fileUrl);
      return () => URL.revokeObjectURL(fileUrl);
    }
  };

  const updateAgentMutation = {
    isPending: isUploading,
    handleImageChange,
    mutate: async (editAgentFormData: EditAgentFormData) => {
      setIsUploading(true);
      setTransactionStatus({
        status: "STARTING",
        finalized: false,
        message: "Updating Agent",
      });

      try {
        const { name, apiUrl } = editAgentFormData;

        const cid = await uploadMetadata(editAgentFormData, imageFile);

        const estimatedFee = 1n;

        await updateAgentOnChain({
          agentKey,
          name,
          apiUrl,
          metadata: cidToIpfsUri(cid),
          selectedAccount,
          accountFreeBalance,
          estimatedFee,
          updateAgentOnChain: updateAgentFunc,
          setTransactionStatus,
          toast,
          setIsUploading,
          form,
          setIsOpen,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(errorMessage);
        toast({
          title: "Error Updating Agent",
          description: errorMessage,
          variant: "destructive",
        });
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: errorMessage,
        });
        setIsUploading(false);
      }
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
        {transactionStatus && (
          <TransactionStatus
            status={transactionStatus.status}
            message={transactionStatus.message}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
