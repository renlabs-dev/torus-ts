"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@torus-ts/ui/components/dialog";
import type { TransactionResult } from "@torus-ts/ui/components/transaction-status";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { UnsavedChangesDialog } from "~/app/_components/unsaved-changes-dialog";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { api } from "~/trpc/react";
import { UpdateAgentButtonContent } from "../update-agent-button.shared";
import {
  cidToIpfsUri,
  updateAgentOnChain,
  uploadMetadata,
} from "./update-agent-dialog-util";
import type { UpdateAgentFormData } from "./update-agent-form-schema";
import { updateAgentSchema } from "./update-agent-form-schema";
import { UpdateAgentTabs } from "./update-agent-tabs";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-network/sdk";

interface UpdateAgentDialogProps {
  agentKey: string;
}

export function UpdateAgentDialog({ agentKey }: UpdateAgentDialogProps) {
  const { toast } = useToast();
  const { updateAgent, selectedAccount, api: torusApi } = useTorus();
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const { data: accountFreeBalance } = useFreeBalance(
    torusApi,
    selectedAccount?.address as SS58Address,
  );

  const { data: agent } = api.agent.byKeyLastBlock.useQuery(
    { key: agentKey },
    { enabled: !!agentKey, refetchOnWindowFocus: false },
  );

  const { data: agentMetadata } = useQueryAgentMetadata(
    agent?.metadataUri ?? "",
    {
      fetchImages: true,
      enabled: !!agent?.metadataUri,
    },
  );

  const form = useForm<UpdateAgentFormData>({
    resolver: zodResolver(updateAgentSchema),
    defaultValues: {
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
    },
  });

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (isOpen && !open && form.formState.isDirty && !isUploading) {
        setShowConfirmClose(true);
        return;
      }
      setIsOpen(open);
      if (!open) form.reset();
    },
    [isOpen, isUploading, form],
  );

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        form.setValue("imageUrl", URL.createObjectURL(file));
      }
    },
    [form],
  );

  const updateAgentMutation = useMemo(
    () => ({
      isPending: isUploading,
      handleImageChange,
      mutate: async (data: UpdateAgentFormData) => {
        setIsUploading(true);
        setTransactionStatus({
          status: "STARTING",
          finalized: false,
          message: "Updating Agent",
        });
        try {
          const { name, apiUrl } = data;
          const cid = await uploadMetadata(data, imageFile);
          await updateAgentOnChain({
            agentKey,
            name,
            apiUrl,
            metadata: cidToIpfsUri(cid),
            selectedAccount,
            accountFreeBalance: accountFreeBalance ?? 0n,
            estimatedFee: 1n,
            updateAgentOnChain: updateAgent,
            setTransactionStatus,
            toast,
            setIsUploading,
            form,
            setIsOpen,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
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
    }),
    [
      isUploading,
      handleImageChange,
      imageFile,
      agentKey,
      selectedAccount,
      accountFreeBalance,
      updateAgent,
      toast,
      form,
    ],
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className="flex w-full items-center gap-1.5 p-3 border-green-500 text-green-500 opacity-65
              transition duration-200 hover:text-green-500 hover:opacity-100
              hover:bg-green-500/10"
          >
            <UpdateAgentButtonContent />
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-[720px] lg:max-w-[1200px] max-h-[80vh] overflow-y-auto p-6">
          <UpdateAgentTabs
            agentKey={agentKey}
            form={form}
            updateAgentMutation={updateAgentMutation}
            imageFile={imageFile}
            hasUnsavedChanges={form.formState.isDirty}
          />
          {transactionStatus.status && (
            <div className="mt-4 border rounded-md p-3 bg-black/5">
              <TransactionStatus
                status={transactionStatus.status}
                message={transactionStatus.message}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      <UnsavedChangesDialog
        open={showConfirmClose}
        onOpenChange={setShowConfirmClose}
        onCancel={() => setShowConfirmClose(false)}
        onConfirm={() => {
          setShowConfirmClose(false);
          setIsOpen(false);
          form.reset();
        }}
      />
    </>
  );
}