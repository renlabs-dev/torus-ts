import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { toast } from "@torus-ts/toast-provider";
import {
  Button,
  Checkbox,
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
    selectedAccount,
    networkConfigs,
  } = useGovernance();

  const [applicationKey, setApplicationKey] = useState("");

  const [discordId, setDiscordId] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [criteriaAgreement, setCriteriaAgreement] = useState(false);

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

      if (!networkConfigs.data) {
        toast.error("Network configs are still loading");
        return;
      }

      const daoApplicationCost = networkConfigs.data.agentApplicationCost;

      if (accountFreeBalance.data > daoApplicationCost) {
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
    return "Submit Application";
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div
          className="flex flex-col items-center gap-2 sm:flex-row"
          title="Use your wallet's address if you want your agent/module to use your wallet."
        >
          <Input
            onChange={(e) => setApplicationKey(e.target.value)}
            placeholder="Agent address (SS58 eg. 5D5F...EBnt)"
            className="placeholder:text-sm"
            type="text"
            required
            value={applicationKey}
          />
          <Button
            variant="outline"
            type="button"
            className="w-full sm:w-fit"
            onClick={() => setApplicationKey(selectedAccount?.address ?? "")}
          >
            Paste my address
          </Button>
        </div>
        <Input
          onChange={(e) => setDiscordId(e.target.value)}
          placeholder="Discord ID (17-18 digits)"
          minLength={17}
          maxLength={18}
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
            title="Make sure it's sufficiently descriptive!"
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
              Enter title and body to preview here :)
            </Label>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-2">
        <span className="text-white">
          Application fee:
          <span className="text-muted-foreground">
            {" "}
            {formatToken(networkConfigs.data?.agentApplicationCost ?? 0)} TORUS
          </span>
        </span>
      </div>

      <div className="flex items-start gap-2 text-white md:items-center">
        <Checkbox
          id="terms"
          className="mt-1 md:mt-0"
          required
          checked={criteriaAgreement}
          onClick={() => setCriteriaAgreement(!criteriaAgreement)}
        />
        <Label htmlFor="terms" className="leading-normal">
          My application meets all the{" "}
          <Link
            className="text-cyan-500 underline"
            href="https://docs.torus.network/concepts/agent-application"
            target="_blank"
          >
            requirements
          </Link>{" "}
          defined.
        </Label>
      </div>

      <div className="flex items-start gap-2 text-sm text-muted-foreground">
        <span className="text-sm">
          Note: The application fee will be deducted from your connected wallet.
          If your application get accepted the application fee will be refunded.
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
        disabled={
          !isAccountConnected ||
          !criteriaAgreement ||
          uploading ||
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
