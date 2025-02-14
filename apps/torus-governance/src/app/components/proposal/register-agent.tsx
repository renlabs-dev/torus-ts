import {
  AGENT_METADATA_SCHEMA,
  AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
  checkSS58,
} from "@torus-ts/subspace";
import { toast } from "@torus-ts/toast-provider";
import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  AllocatorAgentItem,
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
import { smallFilename, strToFile } from "@torus-ts/utils/files";
import type { CID } from "@torus-ts/utils/ipfs";
import { cidToIpfsUri, PIN_FILE_RESULT } from "@torus-ts/utils/ipfs";
import { formatToken, fromNano } from "@torus-ts/utils/subspace";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { FolderUp, Info } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { DropzoneState } from "shadcn-dropzone";
import Dropzone from "shadcn-dropzone";
import { z } from "zod";
import type { PinFileOnPinataResponse } from "~/app/api/files/route";
import { useGovernance } from "~/context/governance-provider";

const pinFile = async (file: File): Promise<PinFileOnPinataResponse> => {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/files", {
    method: "POST",
    body,
  });
  const { cid } = PIN_FILE_RESULT.parse(await res.json());
  return { cid };
};

const parseUrl = (url: string): string => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  } else {
    return "https://" + url;
  }
};

type TabsViews = "agent-info" | "about" | "socials" | "register";

export function RegisterAgent(): JSX.Element {
  const {
    isAccountConnected,
    registerAgent,
    accountFreeBalance,
    selectedAccount,
    burnAmount,
    agents,
    lastBlock,
    whitelist,
  } = useGovernance();

  const { registerAgentTransaction, estimateFee } = useTorus();
  const { data: whitelistedApplications, isFetching: isFetchingWhitelist } =
    whitelist;

  const [agentKey, setAgentKey] = useState("");
  const [name, setName] = useState("");
  const [agentApiUrl, setAgentApiUrl] = useState("");

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [body, setBody] = useState("");

  const [icon, setIcon] = useState<File | null>(null);

  const [twitter, setTwitter] = useState("");
  const [github, setGithub] = useState("");
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [website, setWebsite] = useState("");

  const [uploading, setUploading] = useState(false);
  const [aboutPreview, setAboutPreview] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabsViews>("agent-info");

  const [userHasEnoughBalance, setUserHasEnoughBalance] = useState(false);

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

  useEffect(() => {
    if (
      !selectedAccount?.address ||
      !accountFreeBalance.data ||
      estimatedFee === 0n ||
      accountFreeBalance.isFetching ||
      burnAmount.isFetching
    ) {
      return;
    }
    setUserHasEnoughBalance(
      accountFreeBalance.data > estimatedFee + (burnAmount.data ?? 0n),
    );
  }, [
    accountFreeBalance.data,
    accountFreeBalance.isFetching,
    estimatedFee,
    selectedAccount?.address,
    burnAmount.data,
    burnAmount.isFetching,
  ]);

  async function doMetadataPin(): Promise<CID | null> {
    try {
      setUploading(true);

      let imageObj: Record<string, Record<string, string>> = {};
      if (icon) {
        const { cid } = await pinFile(icon);
        imageObj = { images: { icon: cidToIpfsUri(cid) } };
      }

      const metadata = {
        title,
        short_description: shortDescription,
        description: body,
        website: website !== "" ? parseUrl(website) : undefined,
        ...imageObj,

        socials: {
          twitter: twitter !== "" ? parseUrl(twitter) : undefined,
          github: github !== "" ? parseUrl(github) : undefined,
          telegram: telegram !== "" ? parseUrl(telegram) : undefined,
          discord: discord !== "" ? parseUrl(discord) : undefined,
        },
      };

      const validatedMetadata = AGENT_METADATA_SCHEMA.safeParse(metadata);

      if (!validatedMetadata.success) {
        toast.error(
          validatedMetadata.error.errors.map((e) => e.message).join(", "),
        );
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Error on form validation",
        });
        return null;
      }

      const metadataJson = JSON.stringify(metadata, null, 2);

      const file = strToFile(metadataJson, `${name}-agent-metadata.json`);
      const { cid } = await pinFile(file);

      setUploading(false);

      return cid;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      setUploading(false);
      toast.error("Error uploading agent");
    }

    return null;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();

    if (!userHasEnoughBalance) {
      toast.error(
        `Insufficient balance to create agent. Required: ${formatToken(estimatedFee + (burnAmount.data ?? 0n))} but got ${formatToken(accountFreeBalance.data ?? 0n)}`,
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Insufficient balance",
      });
      return;
    }

    const parsedAgentKey = checkSS58(agentKey);

    if (isFetchingWhitelist) {
      toast.error("Whitelist is still loading. Please try again later.");
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Whitelist is still loading.",
      });
      return;
    }

    if (!whitelistedApplications?.includes(parsedAgentKey)) {
      toast.error(
        "Agent not whitelisted. Whitelist required for registration.",
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Agent not whitelisted.",
      });
      return;
    }

    if (agents.data?.has(parsedAgentKey)) {
      toast.error(
        "Agent already registered. Make sure you are using the correct address.",
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Agent already registered.",
      });
      return;
    }

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting agent creation...",
    });

    const partialMetadata = {
      title,
      short_description: shortDescription,
      description: body,
      website: website !== "" ? parseUrl(website) : undefined,
      socials: {
        twitter: twitter !== "" ? parseUrl(twitter) : undefined,
        github: github !== "" ? parseUrl(github) : undefined,
        telegram: telegram !== "" ? parseUrl(telegram) : undefined,
        discord: discord !== "" ? parseUrl(discord) : undefined,
      },
    };

    const parsedMetadata = AGENT_METADATA_SCHEMA.safeParse(partialMetadata);
    console.log(partialMetadata);
    if (!parsedMetadata.success) {
      toast.error(
        parsedMetadata.error.errors
          .map((e) => `${e.message} at ${e.path.join(".")}`)
          .join(", "),
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error on form validation.",
      });
      return;
    }

    const parsedAgentApiUrl = z
      .string()
      .url()
      .safeParse(agentApiUrl.trim() === "" ? "null:" : agentApiUrl);

    if (!parsedAgentApiUrl.success) {
      toast.error(
        parsedAgentApiUrl.error.errors
          .map((e) => `${e.message} at ${e.path.join(".")}`)
          .join(", "),
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error on form validation.",
      });
      return;
    }

    const cid = await doMetadataPin();
    if (cid == null) return;
    console.info("Pinned metadata at:", cidToIpfsUri(cid));
    console.log({
      agentKey,
      name,
      url: parsedAgentApiUrl.data,
      metadata: cidToIpfsUri(cid),
      callback: handleCallback,
    });

    void registerAgent({
      agentKey,
      name,
      url: parsedAgentApiUrl.data,
      metadata: cidToIpfsUri(cid),
      callback: handleCallback,
    });
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

  const aboutViewDisabled =
    agentKey === "" ||
    name === "" ||
    shortDescription === "" ||
    !userHasEnoughBalance ||
    !selectedAccount?.address;

  const socialsViewDisabled = title === "" || body === "" || aboutViewDisabled;

  const registerViewDisabled = socialsViewDisabled;

  return (
    <div className="flex flex-col gap-2">
      <Tabs
        defaultValue="agent-info"
        onValueChange={(tab: string) => {
          setCurrentTab(tab as TabsViews);
        }}
        value={currentTab}
      >
        <TabsList className="w-full rounded-full">
          <TabsTrigger value="agent-info" className="w-full rounded-full">
            1. Agent Info
          </TabsTrigger>
          <TabsTrigger
            value="about"
            disabled={aboutViewDisabled}
            className="w-full rounded-full"
          >
            2. Agent Metadata
          </TabsTrigger>
          <TabsTrigger
            value="socials"
            disabled={socialsViewDisabled}
            className="w-full rounded-full"
          >
            3. Links & Socials
          </TabsTrigger>
          <TabsTrigger
            value="register"
            disabled={registerViewDisabled}
            className="w-full rounded-full"
          >
            4. Register
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent-info" className="animate-fade">
          <form
            className="flex flex-col gap-4 py-5"
            onSubmit={() => setCurrentTab("about")}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-key" className="flex items-center gap-2">
                Agent address
                <span className="text-sm text-muted-foreground">
                  (required)
                </span>
              </Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="agent-key"
                  onChange={(e) => setAgentKey(e.target.value)}
                  placeholder="5D5Fb...REBnt"
                  className="placeholder:text-sm"
                  type="text"
                  minLength={47}
                  maxLength={48}
                  value={agentKey}
                  required
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
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-api-url">Agent API URL</Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="agent-api-url"
                  onChange={(e) => setAgentApiUrl(e.target.value)}
                  placeholder="https://agent-one.com"
                  type="text"
                  value={agentApiUrl}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="agent-name" className="flex items-center gap-2">
                Agent Name
                <span className="text-sm text-muted-foreground">
                  (required)
                </span>
              </Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="agent-name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My Agent's Name"
                  type="text"
                  required
                  value={name}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label
                htmlFor="agent-short-description"
                className="flex items-center gap-2"
              >
                Short Description{" "}
                <span className="text-sm text-muted-foreground">
                  (required)
                </span>
              </Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Textarea
                  id="agent-short-description"
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder={`Max ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters`}
                  rows={1}
                  value={shortDescription}
                  maxLength={AGENT_SHORT_DESCRIPTION_MAX_LENGTH}
                  required
                />
              </div>
            </div>
            <Button disabled={aboutViewDisabled}>Continue</Button>
          </form>
        </TabsContent>

        <TabsContent value="about" className="animate-fade">
          <form
            onSubmit={() => setCurrentTab("socials")}
            className="flex flex-col gap-4 py-5"
          >
            <Button
              type="button"
              className="w-fit"
              variant={"outline"}
              onClick={() => setAboutPreview(!aboutPreview)}
              disabled={!body}
            >
              {aboutPreview ? "Edit Agent Markdown" : "Preview Agent Markdown"}
            </Button>

            {!aboutPreview && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="title" className="flex items-center gap-2">
                    Agent title
                    <span className="text-sm text-muted-foreground">
                      (required)
                    </span>
                  </Label>
                  <div className="flex flex-col items-center gap-2 sm:flex-row">
                    <Input
                      id="title"
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="My Agent's Title"
                      type="text"
                      required
                      value={title}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="body" className="flex items-center gap-2">
                    Agent description
                    <span className="text-sm text-muted-foreground">
                      (required)
                    </span>
                  </Label>
                  <Textarea
                    id="body"
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Describe your agent (Markdown supported, HTML tags are not supported)"
                    rows={5}
                    required
                    value={body}
                  />
                </div>
              </div>
            )}

            {aboutPreview && body && (
              <MarkdownPreview
                className="max-h-[40vh] overflow-auto py-4"
                source={`# ${title == "" ? "No title" : title}\n${body}`}
                style={{
                  backgroundColor: "transparent",
                  color: "white",
                }}
              />
            )}
            <Button disabled={socialsViewDisabled}>Continue</Button>
          </form>
        </TabsContent>

        <TabsContent value="socials" className="animate-fade">
          <form
            onSubmit={() => setCurrentTab("register")}
            className="flex flex-col gap-4 py-5"
          >
            <div className="flex flex-col gap-2">
              <div className="relative h-auto w-full border bg-[#080808]">
                <Dropzone
                  containerClassName="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 border-none"
                  dropZoneClassName="border-none"
                  onFileDialogOpen={() => {
                    setIcon(null);
                  }}
                  onDrop={(acceptedFiles: File[]) => {
                    if (acceptedFiles[0]) {
                      setIcon(acceptedFiles[0]);
                    }
                  }}
                  multiple={false}
                  disabled={uploading}
                  maxSize={512000}
                  maxFiles={1}
                  accept={{
                    "image/png": [".png"],
                    "image/jpeg": [".jpg", ".jpeg"],
                    "image/gif": [".gif"],
                    "image/webp": [".webp"],
                  }}
                >
                  {(dropzone: DropzoneState) => (
                    <div className="px-12">
                      {dropzone.isDragAccept && (
                        <div className="text-sm font-medium">
                          Drop your files here!
                        </div>
                      )}

                      {!icon &&
                        !dropzone.isDragAccept &&
                        dropzone.fileRejections.length === 0 && (
                          <div className="flex flex-col items-center gap-1 text-sm font-medium">
                            <span className="flex gap-2 text-nowrap">
                              <FolderUp className="h-4 w-4" />
                              Upload Agent Icon
                            </span>
                            <span className="text-center text-gray-400">
                              Square Image
                            </span>
                            <span className="text-center text-gray-400">
                              (Max 512x512)
                            </span>
                          </div>
                        )}

                      {icon && dropzone.fileRejections.length === 0 && (
                        <div className="flex flex-col items-center gap-1 text-sm font-medium">
                          <span className="flex gap-2 text-nowrap">
                            <FolderUp className="h-4 w-4" />
                            Click to change Icon
                          </span>
                          <span key={icon.name} className="text-xs font-medium">
                            {smallFilename(icon.name)}
                          </span>
                          <span key={icon.size} className="text-xs font-medium">
                            {(icon.size / 1000).toFixed(1)} KB
                          </span>
                          <Image
                            className="absolute inset-0 h-full w-full object-cover opacity-20"
                            src={URL.createObjectURL(icon)}
                            alt={icon.name}
                            width={100}
                            height={100}
                          />
                        </div>
                      )}

                      {dropzone.fileRejections.map((fileRej, idx) => (
                        <div
                          key={idx}
                          className="flex flex-col items-center gap-1 text-sm font-medium"
                        >
                          <span className="flex gap-1.5 text-nowrap">
                            Rejected file: {smallFilename(fileRej.file.name)}
                          </span>
                          {fileRej.errors.map((err, idx) => (
                            <span
                              key={idx}
                              className="text-xs font-medium text-red-500"
                            >
                              {err.message}
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </Dropzone>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="socials-x/twitter">X/Twitter</Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="socials-x/twitter"
                  onChange={(e) => setTwitter(e.target.value)}
                  placeholder={"x.com/agent-profile"}
                  type="text"
                  value={twitter}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="socials-github">Github</Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="socials-github"
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder={"github.com/agent-repository"}
                  type="text"
                  value={github}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="socials-telegram">Telegram</Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="socials-telegram"
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder={"t.me/agent-profile"}
                  type="text"
                  value={telegram}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="socials-discord">Discord</Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="socials-discord"
                  onChange={(e) => setDiscord(e.target.value)}
                  placeholder={"discord.gg/agent-server"}
                  type="text"
                  value={discord}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="socials-website">Website</Label>
              <div className="flex flex-col items-center gap-2 sm:flex-row">
                <Input
                  id="socials-website"
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={"www.agent-website.com"}
                  type="text"
                  value={website}
                />
              </div>
            </div>
            <Button>Continue</Button>
          </form>
        </TabsContent>

        <TabsContent value="register" className="animate-fade">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-5">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex w-fit flex-col gap-2 lg:w-1/2">
                <span>Agent Card Preview</span>
                <AllocatorAgentItem
                  agentKey={agentKey}
                  iconUrl={icon ? URL.createObjectURL(icon) : null}
                  socialsList={{ discord, github, telegram, twitter, website }}
                  shortDescription={shortDescription}
                  title={title}
                  currentBlock={lastBlock.data?.blockNumber}
                />
              </div>
              <div className="flex w-full flex-col gap-2 lg:w-1/2">
                <span>Agent Expanded Preview</span>
                {body && (
                  <MarkdownPreview
                    className="max-h-[44vh] w-full overflow-auto pb-4"
                    source={`# ${title == "" ? "No title" : title}\n${body}`}
                    style={{
                      backgroundColor: "transparent",
                      color: "white",
                    }}
                  />
                )}
              </div>
            </div>

            <Button
              size="lg"
              type="submit"
              variant="default"
              className="flex items-center gap-2"
              disabled={registerViewDisabled}
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
        </TabsContent>
      </Tabs>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-start">
          {!userHasEnoughBalance &&
            selectedAccount?.address &&
            estimatedFee !== 0n && (
              <span className="text-sm text-red-400">
                You don't have enough balance to submit an application.
              </span>
            )}

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>
              Info: The registration fee and burn amount will be deducted from
              your connected wallet.
            </AlertTitle>
            <AlertDescription className="flex flex-row gap-2 text-sm">
              <span className="text-white">
                Application fee:{" "}
                {selectedAccount && (
                  <span className="text-muted-foreground">
                    {estimatedFee
                      ? `${fromNano(estimatedFee)} TORUS`
                      : "Loading..."}
                  </span>
                )}
                {!selectedAccount && (
                  <span className="text-muted-foreground">
                    connect your wallet to calculate the fee.
                  </span>
                )}
              </span>

              <span className="text-white">
                Burn amount:{" "}
                {selectedAccount && (
                  <span className="text-muted-foreground">
                    {burnAmount.data != null
                      ? `${fromNano(burnAmount.data)} TORUS`
                      : "Loading..."}
                  </span>
                )}
                {!selectedAccount && (
                  <span className="text-muted-foreground">
                    connect your wallet to calculate the burn amount.
                  </span>
                )}
              </span>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
