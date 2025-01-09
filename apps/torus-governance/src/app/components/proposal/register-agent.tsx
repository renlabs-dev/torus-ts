import { useState } from "react";
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
import { useTorus } from "@torus-ts/torus-provider";
import { Info } from "lucide-react";

const moduleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function RegisterAgent(): JSX.Element {
  const router = useRouter();
  const { isAccountConnected, registerAgent, accountFreeBalance } =
    useGovernance();

  const [agentKey, setAgentKey] = useState("");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

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
    return "Register Agent";
  };

  const { selectedAccount } = useTorus();

  return (
    <form onSubmit={HandleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-0">
          <Input
            onChange={(e) => setAgentKey(e.target.value)}
            placeholder="Agent's address in SS58 format (eg. 12sPm....n88b)"
            type="text"
            value={agentKey}
            title="Paste the same address that you used in your agent application!"
          />
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => setAgentKey(selectedAccount?.address || "")}
            title="Only use your wallet's address if you also used it in your agent application!"
          >
            Paste my wallet address
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
        <TabsList className="mt-3" title="Switch between editing and previewing the markdown content">
          <TabsTrigger value="edit">Edit Content</TabsTrigger>
          <TabsTrigger value="preview">Preview Content</TabsTrigger>
        </TabsList>
        <TabsContent value="edit" className="flex flex-col gap-1 mt-1">
          <Input
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Agent title..."
            type="text"
            required
            value={title}
          />
          <Textarea
            onChange={(e) => setBody(e.target.value)}
            placeholder="Agent body... (Markdown supported, HTML tags are not supported)"
            rows={5}
            required
            value={body}
          />
        </TabsContent>
        <TabsContent value="preview" className="rounded-md bg-muted p-4 mt-0">
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
      <div className="flex items-start gap-2 text-sm text-yellow-500">
        <Info className="mt-[1px]" size={16} />
        <Label className="text-sm">
          Note: When you click "Register Agent", the agent registration fee (currently X TORUS tokens) will be deducted from your wallet.
          Even if you provided a different wallet address for your agent, the registration fee is paid from your wallet!
        </Label>
      </div>
      <Button
        size="lg"
        type="submit"
        variant="outline"
        disabled={!isAccountConnected}
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
