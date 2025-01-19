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
import { formatToken, fromNano, smallAddress } from "@torus-ts/utils/subspace";

import type { DropzoneState } from "shadcn-dropzone";
import Dropzone from "shadcn-dropzone";

import { useGovernance } from "~/context/governance-provider";
import { useTorus } from "@torus-ts/torus-provider";
import { FolderUp } from "lucide-react";

const z_url = z.string().url();

export const AGENT_SHORT_DESCRIPTION_MAX_LENGTH = 64;

const AGENT_METADATA_SCHEMA = z.object({
  title: z.string().nonempty("Agent title is required"),
  short_description: z
    .string()
    .nonempty("Agent short description is required")
    .max(
      AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
      `Short description must be less than ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters"`,
    ),
  description: z.string().nonempty("Agent description is required"),
  icon: z_url.optional(),
  banner: z_url.optional(),
  website: z_url.optional(),
  socials: z
    .object({
      twitter: z.string(),
      discord: z.string(),
      github: z.string(),
      telegram: z.string(),
    })
    .partial(),
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

  const [shortDescription, setShortDescription] = useState("");
  // const [icon, setIcon] = useState<File | null>(null);
  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");

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

  async function doSubmit(fileToUpload: File): Promise<void> {
    try {
      setUploading(true);

      // Upload icon if present
      // let iconUrl = "";
      // if (icon) {
      //   const iconData = new FormData();
      //   iconData.set("file", icon);
      //   const iconRes = await fetch("/api/files", {
      //     method: "POST",
      //     body: iconData,
      //   });
      //   const iconIpfs = (await iconRes.json()) as { IpfsHash: string };
      //   if (iconIpfs.IpfsHash && iconIpfs.IpfsHash !== "undefined") {
      //     iconUrl = `ipfs://${iconIpfs.IpfsHash}`;
      //   }
      // }

      // const metadata = {
      //   title,
      //   short_description: shortDescription,
      //   description: body,
      //   // icon: iconUrl,
      //   website: url,
      //   socials: {
      //     twitter,
      //     github,
      //     telegram,
      //     discord,
      //   },
      // };

      // const metadataBlob = new Blob([JSON.stringify(metadata)], {
      //   type: "application/json",
      // });
      // const metadataFile = new File([metadataBlob], "metadata.json", {
      //   type: "application/json",
      // });

      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      // TODO: validate response with zod, or move to tRPC
      const ipfs = (await res.json()) as { IpfsHash: string };
      setUploading(false);

      if (ipfs.IpfsHash === "undefined" || !ipfs.IpfsHash) {
        toast.error("Error uploading agent metadata");
        return;
      }

      if (!accountFreeBalance.data) {
        toast.error("Balance is still loading");
        return;
      }

      const moduleCost = 2000;

      if (Number(accountFreeBalance.data) > moduleCost) {
        //! TODO EXTRACT FUNCTION, this should be outside
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting agent creation...",
    });

    const result = AGENT_METADATA_SCHEMA.safeParse({
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

    const moduleData = JSON.stringify(result.data);

    const blob = new Blob([moduleData], { type: "application/json" });
    const fileToUpload = new File([blob], "proposal.json", {
      type: "application/json",
    });

    void doSubmit(fileToUpload);
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Agent URL (eg. https://agent-one.com)"
          type="text"
          value={url}
        />
        <div className="mt-4 flex flex-row gap-2">
          <div className="flex">
            <div className="w-fit border bg-[#080808]">
              <Dropzone
                onDrop={(acceptedFiles: File[]) => {
                  if (acceptedFiles.length > 0) {
                    // void doSubmit(acceptedFiles[0]);
                  }
                }}
                multiple={false}
                disabled={uploading}
                maxSize={512000}
                maxFiles={1}
              >
                {(dropzone: DropzoneState) => (
                  <div className="px-12">
                    {dropzone.isDragAccept ? (
                      <div className="text-sm font-medium">
                        Drop your files here!
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex flex-col items-center gap-1 text-sm font-medium">
                          <span className="flex gap-1 text-nowrap">
                            <FolderUp className="h-4 w-4" /> Upload Agent Icon
                          </span>
                          <span className="text-center text-gray-400">
                            Square Img (500x500)
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="text-center text-xs font-medium text-gray-400">
                      {dropzone.acceptedFiles.map((file) => (
                        <span className="text-xs font-medium">
                          {smallAddress(file.name)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </Dropzone>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2">
            <Input
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent Name (eg. agent-one)"
              type="text"
              value={name}
            />
            <Textarea
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Agent Short Description (Max 60 characters)"
              rows={3}
              value={shortDescription}
              maxLength={AGENT_SHORT_DESCRIPTION_MAX_LENGTH}
              className="pb-[1rem]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            onChange={(e) => setTwitter(e.target.value)}
            placeholder={"Agent X (eg. x.com/agent-one)"}
            type="text"
            value={twitter}
          />
          <Input
            onChange={(e) => setGithub(e.target.value)}
            placeholder={"Agent Github (eg. github.com/agent-one)"}
            type="text"
            value={github}
          />
          <Input
            onChange={(e) => setTelegram(e.target.value)}
            placeholder={"Agent Telegram (eg. t.me/agent-one)"}
            type="text"
            value={telegram}
          />
          <Input
            onChange={(e) => setDiscord(e.target.value)}
            placeholder={"Agent Discord (eg. discord.gg/agent-one)"}
            type="text"
            value={discord}
          />
        </div>
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
