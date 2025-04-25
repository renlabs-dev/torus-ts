"use client";

import type { EditAgentFormData } from "./edit-agent-form-schema";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { formatToken } from "@torus-network/torus-utils/subspace";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";

interface ToastProps {
  title: string;
  description: string;
  variant?: "default" | "destructive" | null;
}

type ToastFunction = (props: ToastProps) => void;

export const strToFile = (
  str: string,
  filename: string,
  type = "application/json",
): File => {
  const blob = new Blob([str], { type });
  return new File([blob], filename, { type });
};

export const pinFile = async (file: File): Promise<{ cid: string }> => {
  const data = new FormData();
  data.set("file", file);

  const res = await fetch("/api/files", {
    method: "POST",
    body: data,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file: ${res.statusText}`);
  }

  return res.json() as Promise<{ cid: string }>;
};

export const cidToIpfsUri = (cid: string): string => {
  return `ipfs://${cid}`;
};

export const uploadMetadata = async (
  metadata: EditAgentFormData,
  imageFile: File | null,
) => {
  try {
    const metadataObj: Record<string, string | undefined | null | object> = {
      title: metadata.title,
      short_description: metadata.shortDescription,
      description: metadata.description,
      website: metadata.website,
      socials: {
        twitter: metadata.socials.twitter,
        github: metadata.socials.github,
        telegram: metadata.socials.telegram,
        discord: metadata.socials.discord,
      },
    };

    if (imageFile) {
      const { cid: imageCid } = await pinFile(imageFile);
      metadataObj.images = { icon: cidToIpfsUri(imageCid) };
    }

    const metadataJson = JSON.stringify(metadataObj, null, 2);
    const metadataFile = strToFile(
      metadataJson,
      `${metadata.name}-agent-metadata.json`,
    );

    const { cid } = await pinFile(metadataFile);

    return cid;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to upload metadata:", errorMessage);
    throw new Error(`Failed to upload metadata: ${errorMessage}`);
  }
};

export const checkUserHasEnoughBalance = (
  accountFreeBalance: bigint,
  estimatedFee: bigint,
): boolean => {
  return accountFreeBalance > estimatedFee;
};

export const showInsufficientBalanceError = (
  toast: ToastFunction,
  setTransactionStatus: (status: TransactionResult) => void,
  accountFreeBalance: bigint,
  estimatedFee: bigint,
) => {
  toast({
    title: "Insufficient Balance",
    description: `Required: ${formatToken(estimatedFee)} but you have ${formatToken(accountFreeBalance)}`,
  });

  setTransactionStatus({
    status: "ERROR",
    finalized: true,
    message: "Insufficient balance",
  });

  return false;
};

export const estimateTransactionFee = async (
  selectedAccount: InjectedAccountWithMeta | null | undefined,
  estimateFee: (tx: unknown) => Promise<bigint | null>,
  createTransaction: (params: {
    name: string;
    metadata: string;
    url: string;
    callback?: () => void;
  }) => unknown,
  toast: ToastFunction,
): Promise<bigint> => {
  if (!selectedAccount?.address) return 0n;

  try {
    const transaction = createTransaction({
      name: "Estimating fee",
      metadata: "Estimating fee",
      url: "Estimating fee",
      callback: () => {
        // Empty callback implementation
      },
    });

    if (!transaction) {
      toast({
        title: "Error",
        description: "Error estimating fee.",
      });
      return 0n;
    }

    const fee = await estimateFee(transaction);
    if (fee == null) {
      toast({
        title: "Error",
        description: "Error estimating fee.",
      });
      return 0n;
    }

    return (fee * 101n) / 100n;
  } catch (error) {
    console.error("Error estimating fee:", error);
    return 0n;
  }
};

export const getAccountBalance = (
  selectedAccount: InjectedAccountWithMeta | null | undefined,
): bigint => {
  if (
    !selectedAccount?.address ||
    typeof selectedAccount.freeBalance !== "bigint"
  ) {
    return 0n;
  }

  return selectedAccount.freeBalance;
};

export const updateAgentOnChain = async ({
  agentKey,
  name,
  apiUrl,
  metadata,
  selectedAccount,
  accountFreeBalance,
  estimatedFee,
  updateAgentOnChain,
  setTransactionStatus,
  toast,
  setIsUploading,
  form,
  setIsOpen,
}: {
  agentKey: string;
  name: string;
  apiUrl?: string;
  metadata: string;
  selectedAccount: InjectedAccountWithMeta | null;
  accountFreeBalance: bigint;
  estimatedFee: bigint;
  updateAgentOnChain: (params: {
    name: string;
    url: string;
    metadata: string;
    callback: (tx: TransactionResult) => void;
  }) => Promise<void>;
  setTransactionStatus: (status: TransactionResult) => void;
  toast: ToastFunction;
  setIsUploading: (isUploading: boolean) => void;
  form: { reset: () => void };
  setIsOpen: (isOpen: boolean) => void;
}) => {
  if (!agentKey) {
    throw new Error("Agent key is required");
  }

  if (!selectedAccount) {
    throw new Error("No wallet connected");
  }

  if (!checkUserHasEnoughBalance(accountFreeBalance, estimatedFee)) {
    return showInsufficientBalanceError(
      toast,
      setTransactionStatus,
      accountFreeBalance,
      estimatedFee,
    );
  }

  try {
    await updateAgentOnChain({
      name,
      url: apiUrl ?? "",
      metadata,
      callback: (tx) => {
        setTransactionStatus(tx);
        form.reset();
        setIsOpen(false);
        setIsUploading(false);
      },
    });
  } catch (error) {
    setIsUploading(false);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    toast({
      title: "Error Updating Agent",
      description: errorMessage,
    });

    setTransactionStatus({
      status: "ERROR",
      finalized: true,
      message: "Error Updating Agent",
    });

    return false;
  }
};
