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
import { useBlobUrl } from "~/hooks/use-blob-url";
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
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(
    null,
  );
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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

  const currentImageBlobUrl = useBlobUrl(agentMetadata?.images.icon);

  useEffect(() => {
    if (currentImagePreview && currentImagePreview !== currentImageBlobUrl) {
      URL.revokeObjectURL(currentImagePreview);
    }
    setCurrentImagePreview(currentImageBlobUrl);
  }, [currentImageBlobUrl, currentImagePreview]);

  useEffect(() => {
    return () => {
      if (currentImagePreview) {
        URL.revokeObjectURL(currentImagePreview);
      }
    };
  }, [currentImagePreview]);

  const [originalFormData, setOriginalFormData] =
    useState<UpdateAgentFormData | null>(null);

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
      imageFile: undefined,
      socials: {
        twitter: "",
        github: "",
        telegram: "",
        discord: "",
      },
    },
  });

  useEffect(() => {
    const subscription = form.watch((_value, { type }) => {
      if (type === "change") {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (agent && agentMetadata) {
      const originalData = {
        name: agent.name ?? "",
        title: agentMetadata.metadata.title || "",
        shortDescription: agentMetadata.metadata.short_description || "",
        description: agentMetadata.metadata.description || "",
        website: agentMetadata.metadata.website ?? "",
        apiUrl: agent.apiUrl ?? "",
        imageFile: undefined,
        socials: {
          twitter: agentMetadata.metadata.socials?.twitter ?? "",
          github: agentMetadata.metadata.socials?.github ?? "",
          telegram: agentMetadata.metadata.socials?.telegram ?? "",
          discord: agentMetadata.metadata.socials?.discord ?? "",
        },
      };

      setOriginalFormData(originalData);
      form.reset(originalData);
      setHasUnsavedChanges(false);
    }
  }, [agent, agentMetadata, form]);

  const handleDialogChange = useCallback(
    (open: boolean) => {
      if (!open && isUploading) {
        return;
      }
      if (!open && !isUploading) {
        const formValues = form.getValues();
        const hasNewImage = formValues.imageFile !== undefined;
        const hasChanges = hasNewImage || hasUnsavedChanges;

        if (hasChanges) {
          setShowConfirmClose(true);
          return;
        }

        setIsOpen(false);
        form.reset();
        if (originalFormData) {
          form.reset(originalFormData);
        }
        return;
      }
      setIsOpen(open);
      if (!open) {
        form.reset();
        if (originalFormData) {
          form.reset(originalFormData);
        }
        setHasUnsavedChanges(false);
      }
    },
    [isUploading, setIsOpen, form, hasUnsavedChanges, originalFormData],
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
        form.setValue("imageFile", file);
        setHasUnsavedChanges(true);
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

        const cid = await uploadMetadata(
          data,
          currentImageBlobUrl ?? undefined,
        );

        await updateAgentTransaction({
          url: apiUrl ?? "",
          metadata: cidToIpfsUri(cid),
          callback: (tx) => {
            if (tx.status === "SUCCESS" && !tx.message?.includes("included")) {
              setIsOpen(false);
              setIsUploading(false);
            }

            if (tx.status === "ERROR") {
              setIsUploading(false);
            }

            setTransactionStatus(tx);
          },
        });
      },
    }),
    [
      isUploading,
      handleImageChange,
      updateAgentTransaction,
      setIsOpen,
      setTransactionStatus,
      currentImageBlobUrl,
    ],
  );

  return (
    <>
      <UpdateAgentDialogTabs
        agentKey={agentKey}
        form={form}
        updateAgentMutation={updateAgentMutation}
        currentImagePreview={currentImagePreview}
      />
      {transactionStatus.status && (
        <TransactionStatus
          status={transactionStatus.status}
          message={transactionStatus.message}
        />
      )}
      <UnsavedChangesDialog
        open={showConfirmClose}
        onOpenChange={setShowConfirmClose}
        onCancel={() => setShowConfirmClose(false)}
        onConfirm={() => {
          setShowConfirmClose(false);
          setIsOpen(false);
          if (originalFormData) {
            form.reset(originalFormData);
          }
          setHasUnsavedChanges(false);
        }}
      />
    </>
  );
}
