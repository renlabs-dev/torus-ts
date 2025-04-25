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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { UnsavedChangesDialog } from "~/app/_components/unsaved-changes-dialog";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { api } from "~/trpc/react";
import { EditAgentButtonContent } from "../edit-agent-button.shared";
import {
  cidToIpfsUri,
  getAccountBalance,
  updateAgentOnChain,
  uploadMetadata,
} from "./edit-agent-dialog-util";
import type { EditAgentFormData } from "./edit-agent-form-schema";
import { editAgentSchema } from "./edit-agent-form-schema";
import { EditAgentTabs } from "./edit-agent-tabs";

export interface EditAgentDialogProps {
  agentKey: string;
}

export function EditAgentDialog({ agentKey }: EditAgentDialogProps) {
  const { toast } = useToast();
  const { updateAgent: updateAgentFunc, selectedAccount } = useTorus();
  const [isOpen, setIsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [transactionStatus, setTransactionStatus] =
    useState<TransactionResult | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [formIsDirty, setFormIsDirty] = useState(false);

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

  const accountFreeBalance = useMemo(
    () => (selectedAccount ? getAccountBalance(selectedAccount) : 0n),
    [selectedAccount],
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
    setFormIsDirty(false);
  }, [form, agent, agentMetadata]);

  useEffect(() => {
    const subscription = form.watch(() =>
      setFormIsDirty(form.formState.isDirty),
    );
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    resetFormData();
  }, [agent, agentMetadata, resetFormData]);

  useEffect(() => {
    if (isOpen) {
      setTransactionStatus(null);
    }
  }, [isOpen]);

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (isOpen && !open && formIsDirty && !isUploading) {
        setShowConfirmClose(true);
        return;
      }

      setIsOpen(open);
      if (open) resetFormData();
    },
    [isOpen, formIsDirty, isUploading, resetFormData],
  );

  const handleCloseConfirm = useCallback(() => {
    setShowConfirmClose(false);
    setIsOpen(false);
    setFormIsDirty(false);
  }, []);

  const handleCloseCancel = useCallback(() => {
    setShowConfirmClose(false);
  }, []);

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        const file = e.target.files[0];
        setImageFile(file);
        const fileUrl = URL.createObjectURL(file);
        form.setValue("imageUrl", fileUrl);
        setFormIsDirty(true);
      }
    },
    [form],
  );

  const updateAgentMutation = useMemo(
    () => ({
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

          setFormIsDirty(false);
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
    }),
    [
      isUploading,
      handleImageChange,
      imageFile,
      agentKey,
      selectedAccount,
      accountFreeBalance,
      updateAgentFunc,
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
            <EditAgentButtonContent />
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-[720px] lg:max-w-[1200px] max-h-[80vh] overflow-y-auto p-6">
          <EditAgentTabs
            agentKey={agentKey}
            form={form}
            updateAgentMutation={updateAgentMutation}
            imageFile={imageFile}
            hasUnsavedChanges={formIsDirty}
          />
          {transactionStatus && (
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
        onCancel={handleCloseCancel}
        onConfirm={handleCloseConfirm}
      />
    </>
  );
}
