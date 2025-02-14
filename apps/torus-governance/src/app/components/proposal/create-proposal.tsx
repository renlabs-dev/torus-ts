import { toast } from "@torus-ts/toast-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import {
  Button,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TransactionStatus,
} from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { z } from "zod";

import { useGovernance } from "~/context/governance-provider";

const proposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function CreateProposal(): JSX.Element {
  const router = useRouter();
  const {
    isAccountConnected,
    addCustomProposal,
    accountFreeBalance,
    networkConfigs,
    selectedAccount,
  } = useGovernance();

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

  function handleCallback(callbackReturn: TransactionResult): void {
    setTransactionStatus(callbackReturn);
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
        toast.error("Balance is still loading");
        return;
      }

      const proposalCost = 10000;

      if (Number(accountFreeBalance.data) > proposalCost) {
        void addCustomProposal({
          IpfsHash: `ipfs://${ipfs.IpfsHash}`,
          callback: handleCallback,
        });
      } else {
        toast.error(
          `Insufficient balance to create proposal. Required: ${proposalCost} but got ${formatToken(accountFreeBalance.data)}`,
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Insufficient balance",
        });
      }
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading proposal");
    }
  }

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting proposal creation...",
    });

    const result = proposalSchema.safeParse({
      title,
      body,
    });

    if (!result.success) {
      toast.error(result.error.errors.map((e) => e.message).join(", "));
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error on form validation",
      });
      return;
    }

    const proposalData = JSON.stringify({
      title,
      body,
    });
    const blob = new Blob([proposalData], { type: "application/json" });
    const fileToUpload = new File([blob], "proposal.json", {
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
    return "Submit Proposal";
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
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Your proposal title here..."
            type="text"
            required
            value={title}
          />
          <Textarea
            onChange={(e) => setBody(e.target.value)}
            placeholder="Your proposal body here... (Markdown supported / HTML tags are not supported)"
            rows={5}
            required
            value={body}
          />
        </TabsContent>
        <TabsContent value="preview" className="rounded-radius bg-muted p-3">
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
          !isAccountConnected || !title || !body || !userHasEnoughtBalance
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
      <div className="flex flex-wrap items-center gap-1 text-sm text-white">
        <Info size={16} />
        <Label className="text-sm text-white">
          Want a different approach?{" "}
          <Link
            className="text-cyan-500 underline"
            href="https://docs.torus.network/concepts/torus-dao"
            target="_blank"
          >
            Check how to create a proposal with the CLI tool
          </Link>
        </Label>
      </div>
    </form>
  );
}
