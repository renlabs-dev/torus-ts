import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { Info } from "lucide-react";
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
import { formatToken } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";
import { useTorus } from "@torus-ts/torus-provider";

const agentApplicationSchema = z.object({
  applicationKey: z.string().min(1, "Application Key is required"),
  discordId: z.string().min(16, "Discord ID is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

export function CreateAgentApplication(): JSX.Element {
  const router = useRouter();
  const {
    isAccountConnected,
    AddAgentApplication,
    accountFreeBalance,
    agentApplications,
  } = useGovernance();

  const [applicationKey, setApplicationKey] = useState("");

  const [discordId, setDiscordId] = useState("");
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

  const refetchHandler = async () => {
    await agentApplications.refetch();
  };

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

      const daoApplicationCost = 1000;

      if (Number(accountFreeBalance.data) > daoApplicationCost) {
        void AddAgentApplication({
          applicationKey,
          IpfsHash: `ipfs://${ipfs.IpfsHash}`,
          removing: false,
          callback: handleCallback,
          refetchHandler,
        });
      } else {
        toast.error(
          `Insufficient balance to create Agent Application. Required: ${daoApplicationCost} but got ${formatToken(accountFreeBalance.data)}`,
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Insufficient balance to create Agent Application",
        });
      }
      router.refresh();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading Agent Application");
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting Agent Application creation...",
    });

    const result = agentApplicationSchema.safeParse({
      title,
      body,
      applicationKey,
      discordId,
    });

    if (!result.success) {
      toast.error(result.error.errors.map((e) => e.message).join(", "));
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error creating Agent Application",
      });
      return;
    }

    const daoData = JSON.stringify({
      discord_id: discordId,
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
    return "Submit Agent/Module Application";
  };

  const { selectedAccount } = useTorus();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center gap-2"
          title="Use your wallet's address if you want your agent/module to use your wallet. This is the majority of cases!"
        >
          <Input
            onChange={(e) => setApplicationKey(e.target.value)}
            placeholder="Agent/Module address in SS58 format (eg. 12sPm....n88b)"
            type="text"
            required
            value={applicationKey}
          />
          <Button
            variant="outline"
            type="button"
            onClick={() => setApplicationKey(selectedAccount?.address ?? "")}
          >
            Paste my wallet address
          </Button>
        </div>
        <Input
          onChange={(e) => setDiscordId(e.target.value)}
          placeholder="Agent/Module discord ID"
          type="text"
          required
          value={discordId}
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
            placeholder="Application title"
            title="Title of the application, make sure it's sufficiently descriptive!"
            type="text"
            required
            value={title}
          />
          <Textarea
            onChange={(e) => setBody(e.target.value)}
            placeholder="Application body... (Markdown supported, HTML tags are not supported)"
            title="Make sure your application contains all the information necessary for the Curator DAO to decide on your application!"
            rows={5}
            required
            value={body}
          />
        </TabsContent>
        <TabsContent value="preview" className="mt-0 rounded-md bg-muted p-4">
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
              Enter title and body to preview here :)
            </Label>
          )}
        </TabsContent>
      </Tabs>
      <div className="flex items-start gap-2 text-sm text-yellow-500">
        <Info className="mt-[1px]" size={16} />
        <Label className="text-sm">
          Please ensure that your application meets all the criteria defined in
          this{" "}
          <Link
            className="underline"
            href="https://docs.torus.network/concepts/agent-application"
            target="_blank"
          >
            article
          </Link>{" "}
          to avoid being denied by the Curator DAO.
        </Label>
      </div>
      <div className="flex items-start gap-2 text-sm text-yellow-500">
        <Info className="mt-[1px]" size={16} />
        <Label className="text-sm">
          Note: When submitting your application, an application fee (X TORUS
          tokens) will be deducted from your connected wallet, not from the
          wallet address specified.
        </Label>
      </div>
      <Button
        size="lg"
        type="submit"
        variant="default"
        className="flex items-center gap-2"
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
