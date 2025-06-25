"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/ui/components/transaction-status";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import type { RefObject } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { UnsavedChangesDialog } from "~/app/_components/unsaved-changes-dialog";
import { useQueryAgentMetadata } from "~/hooks/use-agent-metadata";
import { api } from "~/trpc/react";
import type { UpdateAgentFormData } from "./update-agent-dialog-form-schema";
import { updateAgentSchema } from "./update-agent-dialog-form-schema";
import { UpdateAgentDialogTabs } from "./update-agent-dialog-tabs";
import { cidToIpfsUri, uploadMetadata } from "./update-agent-dialog-util";

interface UpdateAgentDialogProps {
  agentKey: string;
  setIsOpen: (open: boolean) => void;
  handleDialogChangeRef: RefObject<((open: boolean) => void) | null>;
}

export default function UpdateAgentDialog({
  agentKey,
  setIsOpen,
  handleDialogChangeRef,
}: UpdateAgentDialogProps) {
  const { updateAgentTransaction } = useTorus();
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
    mode: "onChange",
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

  useEffect(() => {
    if (agent && agentMetadata) {
      form.reset({
        name: agent.name ?? "",
        title: agentMetadata.metadata.title || "",
        shortDescription: agentMetadata.metadata.short_description || "",
        description: agentMetadata.metadata.description || "",
        website: agentMetadata.metadata.website ?? "",
        apiUrl: agent.apiUrl ?? "",
        socials: {
          twitter: agentMetadata.metadata.socials?.twitter ?? "",
          github: agentMetadata.metadata.socials?.github ?? "",
          telegram: agentMetadata.metadata.socials?.telegram ?? "",
          discord: agentMetadata.metadata.socials?.discord ?? "",
        },
      });
    }
  }, [agent, agentMetadata, form]);

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (!open && !isUploading) {
        setShowConfirmClose(true);
        return;
      }
      setIsOpen(open);
      if (!open) form.reset();
    },
    [isUploading, setIsOpen, form],
  );

  useEffect(() => {
    handleDialogChangeRef.current = handleDialogChange;
    return () => {
      handleDialogChangeRef.current = null;
    };
  }, [handleDialogChangeRef, handleDialogChange]);

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
        const { apiUrl } = data;
        const cid = await uploadMetadata(data, imageFile);

        await updateAgentTransaction({
          url: apiUrl ?? "",
          metadata: cidToIpfsUri(cid),
          callback: (tx) => {
            if (tx.status === "SUCCESS" && !tx.message?.includes("included")) {
              setIsOpen(false);
            }

            setTransactionStatus(tx);
            setIsUploading(false);
          },
        });
      },
    }),
    [
      isUploading,
      handleImageChange,
      imageFile,
      updateAgentTransaction,
      setIsOpen,
      setTransactionStatus,
    ],
  );

  return (
    <>
      <UpdateAgentDialogTabs
        agentKey={agentKey}
        form={form}
        updateAgentMutation={updateAgentMutation}
        imageFile={imageFile}
      />
      {transactionStatus.status && (
        <div className="mt-4 border rounded-md p-3 bg-black/5">
          <TransactionStatus
            status={transactionStatus.status}
            message={transactionStatus.message}
          />
        </div>
      )}
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
