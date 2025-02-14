"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/toast-provider";
import {
  Button,
  Input,
  Label,
  Separator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TransactionStatus,
} from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";

const transferDaoTreasuryProposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function CreateTransferDaoTreasuryProposal(): JSX.Element {
  const router = useRouter();
  const {
    networkConfigs,
    isAccountConnected,
    accountFreeBalance,
    addDaoTreasuryTransferProposal,
    selectedAccount,
  } = useGovernance();

  const [value, setValue] = useState("");
  const [destinationKey, setDestinationKey] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  function handleCallback(TransactionReturn: TransactionResult): void {
    setTransactionStatus(TransactionReturn);
  }

  const userHasEnoughtBalance = useCallback(() => {
    if (
      !selectedAccount ||
      !networkConfigs.data ||
      !accountFreeBalance.data ||
      networkConfigs.isFetching ||
      accountFreeBalance.isFetching
    ) {
      return null;
    }

    return accountFreeBalance.data > networkConfigs.data.agentApplicationCost;
  }, [selectedAccount, networkConfigs, accountFreeBalance])();

  async function uploadFile(fileToUpload: File): Promise<void> {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const ipfs = (await res.json()) as { IpfsHash: string };
      setUploading(false);

      if (ipfs.IpfsHash === "undefined" || !ipfs.IpfsHash) {
        toast.error("Error uploading transfer dao treasury proposal");
        return;
      }

      if (!accountFreeBalance.data) {
        toast.error("balance is still loading");
        return;
      }

      const daoApplicationCost = 1000;

      if (Number(accountFreeBalance.data) > daoApplicationCost) {
        void addDaoTreasuryTransferProposal({
          value,
          destinationKey,
          data: `ipfs://${ipfs.IpfsHash}`,
          callback: handleCallback,
        });
      } else {
        toast.error(
          `Insufficient balance to create a transfer dao treasury proposal. Required: ${daoApplicationCost} but got ${formatToken(accountFreeBalance.data)}`,
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message:
            "Insufficient balance to a create transfer dao treasury proposal",
        });
      }
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading transfer dao treasury proposal");
    }
  }

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transfer dao treasury proposal creation...",
    });

    const result = transferDaoTreasuryProposalSchema.safeParse({
      title,
      body,
    });

    if (!result.success) {
      toast.error(result.error.errors.map((e) => e.message).join(", "));
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error creating transfer dao treasury proposal",
      });
      return;
    }

    const daoData = JSON.stringify({
      title,
      body,
    });
    const blob = new Blob([daoData], { type: "application/json" });
    const fileToUpload = new File([blob], "dao.json", {
      type: "application/json",
    });
    void uploadFile(fileToUpload);
  }

  const getButtonSubmitLabel = ({
    uploading,
    isAccountConnected,
  }: {
    uploading: boolean;
    isAccountConnected: boolean;
  }) => {
    if (!isAccountConnected) {
      return "Connect a wallet to submit";
    }
    if (uploading) {
      return "Uploading...";
    }
    return "Submit transfer dao treasury proposal";
  };

  return (
    <form onSubmit={HandleSubmit} className="flex flex-col gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-3">
          <TabsTrigger value="edit">Edit Content</TabsTrigger>
          <TabsTrigger value="preview">Preview Content</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="flex flex-col gap-3">
          <Input
            onChange={(e) => setDestinationKey(e.target.value)}
            placeholder="Destination"
            type="text"
            required
            value={destinationKey}
          />
          <Input
            onChange={(e) => setValue(e.target.value)}
            placeholder="Value"
            type="text"
            required
            value={value}
          />
          <Separator />
          <Input
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Application title"
            type="text"
            required
            value={title}
          />
          <Textarea
            onChange={(e) => setBody(e.target.value)}
            placeholder="Application body... (Markdown supported) / HTML tags are not supported)"
            rows={5}
            value={body}
            required
          />
        </TabsContent>
        <TabsContent value="preview" className="rounded-radius bg-muted p-4">
          {body ? (
            <MarkdownPreview
              className="max-h-[40vh] overflow-auto"
              source={`# ${title}\n${body}`}
              style={{
                backgroundColor: "transparent",
                color: "white",
              }}
            />
          ) : (
            <Label className="text-sm text-white">
              Fill the body to preview here :)
            </Label>
          )}
        </TabsContent>
      </Tabs>
      <div className="flex items-start gap-2">
        <span className="text-white">
          Proposal cost:{" "}
          <span className="text-muted-foreground">
            {formatToken(networkConfigs.data?.proposalCost ?? 0)} TORUS
          </span>
        </span>
      </div>

      <div className="flex flex-col items-start gap-2 text-sm text-muted-foreground">
        <span>
          Note: The proposal cost will be deducted from your connected wallet.
        </span>

        {!userHasEnoughtBalance && selectedAccount?.address && (
          <span className="text-red-400">
            You don't have enough balance to submit an application.
          </span>
        )}
      </div>
      <Button
        size="lg"
        type="submit"
        variant="default"
        disabled={
          !isAccountConnected ||
          uploading ||
          !title ||
          !body ||
          !value ||
          !destinationKey ||
          !userHasEnoughtBalance
        }
      >
        {getButtonSubmitLabel({ uploading, isAccountConnected })}
      </Button>
      {transactionStatus.status && (
        <TransactionStatus
          status={transactionStatus.status}
          message={transactionStatus.message}
        />
      )}
    </form>
  );
}
