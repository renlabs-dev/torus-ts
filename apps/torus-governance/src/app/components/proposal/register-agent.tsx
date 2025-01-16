import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/toast-provider";
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
import { formatToken, fromNano } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";
import { useTorus } from "@torus-ts/torus-provider";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function RegisterAgent(): JSX.Element {
  const router = useRouter();
  const {
    isAccountConnected,
    registerAgent,
    accountFreeBalance,
    selectedAccount,
  } = useGovernance();

  const { registerAgentTransaction, estimateFee } = useTorus();

  const [agentKey, setAgentKey] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");
  const [estimatedFee, setEstimatedFee] = useState(0n);

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

  useEffect(() => {
    async function fetchFee() {
      if (!selectedAccount?.address) return;
      const transaction = registerAgentTransaction({
        agentKey: selectedAccount.address,
        name: "Estimating fee",
        metadata: "Estimating fee",
        url: "Estimating fee",
      });

      if (!transaction) {
        return toast.error("Error estimating fee");
      }

      const fee = await estimateFee(transaction);

      if (fee == null) {
        return toast.error("Error estimating fee");
      }

      const adjustedFee = (fee * 101n) / 100n;
      setEstimatedFee(adjustedFee);
    }

    void fetchFee();
  }, [estimateFee, registerAgentTransaction, selectedAccount?.address]);

  const userHasEnoughtBalance = useCallback(() => {
    if (
      !isAccountConnected ||
      !accountFreeBalance.data ||
      estimatedFee === 0n ||
      accountFreeBalance.isFetching
    ) {
      return null;
    }

    return accountFreeBalance.data > estimatedFee;
  }, [
    isAccountConnected,
    accountFreeBalance.data,
    accountFreeBalance.isFetching,
    estimatedFee,
  ])();

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
        toast.error("Error uploading transfer dao treasury agent cost");
        return;
      }

      if (!accountFreeBalance.data) {
        toast.error("Balance is still loading");
        return;
      }

      const moduleCost = 2000;

      if (Number(accountFreeBalance.data) > moduleCost) {
        void registerAgent({
          agentKey,
          name,
          url,
          metadata: `ipfs://${ipfs.IpfsHash}`,
          callback: handleCallback,
        });
      } else {
        toast.error(
          `Insufficient balance to create agent. Required: ${moduleCost} but got ${formatToken(accountFreeBalance.data)}`,
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
      toast.error("Error uploading agent");
    }
  }

  function HandleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting agent creation...",
    });

    const result = moduleSchema.safeParse({
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

    const moduleData = JSON.stringify({
      title,
      body,
    });
    const blob = new Blob([moduleData], { type: "application/json" });
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
    return "Register Agent/Module";
  };

  return (
    <form onSubmit={HandleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          <Input
            onChange={(e) => setAgentKey(e.target.value)}
            placeholder="Agent address (SS58 eg. 5D5F...EBnt)"
            className="placeholder:text-sm"
            type="text"
            value={agentKey}
            title="Paste the same address that you used in your agent/module application!"
          />
          <Button
            variant="outline"
            type="button"
            className="w-full sm:w-fit"
            onClick={() => setAgentKey(selectedAccount?.address ?? "")}
            title="Only use your wallet's address if you also used it in your agent/module application!"
          >
            Paste my address
          </Button>
        </div>
        <Input
          onChange={(e) => setName(e.target.value)}
          placeholder="Agent Name (eg. agent-one)"
          type="text"
          value={name}
        />
        <Input
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Agent URL (eg. https://agent-one.com)"
          type="text"
          value={url}
        />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className="mt-3"
          title="Switch between editing and previewing the markdown content"
        >
          <TabsTrigger value="edit">Edit Content</TabsTrigger>
          <TabsTrigger value="preview">Preview Content</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="mt-1 flex flex-col gap-1">
          <Input
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Agent/Module title..."
            type="text"
            required
            value={title}
          />
          <Textarea
            onChange={(e) => setBody(e.target.value)}
            placeholder="Agent/Module body... (Markdown supported, HTML tags are not supported)"
            rows={5}
            required
            value={body}
          />
        </TabsContent>
        <TabsContent
          value="preview"
          className="rounded-radius mt-0 bg-muted p-4"
        >
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
          Application fee:{" "}
          {selectedAccount && (
            <span className="text-muted-foreground">
              {estimatedFee ? `${fromNano(estimatedFee)} TORUS` : "Loading..."}
            </span>
          )}
          {!selectedAccount && (
            <span className="text-muted-foreground">
              connect your wallet to calculate the fee.
            </span>
          )}
        </span>
      </div>
      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <span className="text-sm">
          Note: The application fee will be deducted from your connected wallet.
        </span>
      </div>
      {!userHasEnoughtBalance && selectedAccount?.address && (
        <span className="text-sm text-red-400">
          You don't have enough balance to submit an application.
        </span>
      )}
      <Button
        size="lg"
        type="submit"
        variant="default"
        className="flex items-center gap-2"
        disabled={!isAccountConnected || uploading || !userHasEnoughtBalance}
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
