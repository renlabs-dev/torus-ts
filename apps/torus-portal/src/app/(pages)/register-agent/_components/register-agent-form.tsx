"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SS58Address } from "@torus-network/sdk";
import {
  AGENT_METADATA_SCHEMA,
  AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
  checkSS58,
} from "@torus-network/sdk";
import { smallFilename } from "@torus-network/torus-utils/files";
import type { CID } from "@torus-network/torus-utils/ipfs";
import { cidToIpfsUri, PIN_FILE_RESULT } from "@torus-network/torus-utils/ipfs";
import { formatToken, fromNano } from "@torus-network/torus-utils/subspace";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { agentNameField } from "@torus-network/torus-utils/agent-name-validation";
import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@torus-ts/ui/components/alert";
import { AllocatorAgentItem } from "@torus-ts/ui/components/allocator-agent-item";
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { FolderUp, Info } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { DropzoneState } from "shadcn-dropzone";
import Dropzone from "shadcn-dropzone";
import { z } from "zod";
import Link from "next/link";
import { getLinks } from "@torus-ts/ui/lib/data";
import { env } from "~/env";
import type { PinFileOnPinataResponse } from "~/app/api/files/route";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";

const registerAgentSchema = z.object({
  agentKey: z.string().min(1, "Agent address is required"),
  agentApiUrl: z.string().optional(),
  name: agentNameField(),
  shortDescription: z
    .string()
    .min(1, "Short description is required")
    .max(
      AGENT_SHORT_DESCRIPTION_MAX_LENGTH,
      `Max ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters`,
    ),
  title: z.string().min(1, "Agent title is required"),
  body: z.string().min(1, "Agent description is required"),
  twitter: z.string().optional(),
  github: z.string().optional(),
  telegram: z.string().optional(),
  discord: z.string().optional(),
  website: z.string().optional(),
  icon: z.instanceof(File).optional(),
});

const pinFile = async (file: File): Promise<PinFileOnPinataResponse> => {
  const body = new FormData();
  body.set("file", file);
  const res = await fetch("/api/files", {
    method: "POST",
    body,
  });
  if (!res.ok) {
    throw new Error(`Failed to upload file: ${res.statusText}`);
  }
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

type RegisterAgentFormData = z.infer<typeof registerAgentSchema>;
type TabsViews = "agent-info" | "about" | "socials" | "register";

export const strToFile = (
  str: string,
  filename: string,
  type: string = "text/plain",
) => {
  const file = new File([str], filename, { type });
  return file;
};

export default function RegisterAgentForm() {
  const { toast } = useToast();
  const {
    api,
    getRegisterAgentFee,
    estimateFee,
    selectedAccount,
    registerAgentTransaction,
    isAccountConnected,
  } = useTorus();

  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const [currentTab, setCurrentTab] = useState<TabsViews>("agent-info");
  const [uploading, setUploading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const form = useForm<RegisterAgentFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(registerAgentSchema),
    mode: "onChange",
    defaultValues: {
      agentKey: "",
      agentApiUrl: "",
      name: "",
      shortDescription: "",
      title: "",
      body: "",
      twitter: "",
      github: "",
      telegram: "",
      discord: "",
      website: "",
      icon: undefined,
    },
  });
  const { control, handleSubmit, getValues, trigger, watch } = form;

  const [estimatedFee, setEstimatedFee] = useState(0n);
  useEffect(() => {
    async function fetchFee() {
      if (!selectedAccount?.address) return;
      const transaction = getRegisterAgentFee({
        agentKey: selectedAccount.address as SS58Address,
        name: "Estimating fee",
        metadata: "Estimating fee",
        url: "Estimating fee",
      });
      if (!transaction) {
        toast.error("Error estimating fee.");
        return;
      }
      const fee = await estimateFee(transaction);
      if (fee == null) {
        toast.error("Error estimating fee.");
        return;
      }
      const adjustedFee = (fee * 101n) / 100n;
      setEstimatedFee(adjustedFee);
    }
    void fetchFee();
  }, [estimateFee, getRegisterAgentFee, selectedAccount, toast]);

  const [userHasEnoughBalance, setUserHasEnoughBalance] = useState(false);
  useEffect(() => {
    if (
      !selectedAccount?.address ||
      !accountFreeBalance.data ||
      estimatedFee === 0n
    ) {
      return;
    }
    setUserHasEnoughBalance(accountFreeBalance.data > estimatedFee);
  }, [accountFreeBalance.data, estimatedFee, selectedAccount?.address]);

  async function doMetadataPin(): Promise<CID | null> {
    setUploading(true);

    // Handle icon file if present
    let imageObj: Record<string, Record<string, string>> = {};
    const iconFile = getValues("icon");
    if (iconFile) {
      const [iconError, iconResult] = await tryAsync(pinFile(iconFile));
      if (iconError !== undefined) {
        setUploading(false);
        toast.error(iconError.message || "Error uploading icon");
        return null;
      }
      imageObj = { images: { icon: cidToIpfsUri(iconResult.cid) } };
    }

    const {
      website,
      twitter,
      github,
      telegram,
      discord,
      title,
      shortDescription,
      body,
      name,
    } = getValues();

    const metadata = {
      title,
      short_description: shortDescription,
      description: body,
      website: website ? parseUrl(website) : undefined,
      ...imageObj,
      socials: {
        twitter: twitter ? parseUrl(twitter) : undefined,
        github: github ? parseUrl(github) : undefined,
        telegram: telegram ? parseUrl(telegram) : undefined,
        discord: discord ? parseUrl(discord) : undefined,
      },
    };

    const validatedMetadata = AGENT_METADATA_SCHEMA.safeParse(metadata);
    if (!validatedMetadata.success) {
      setUploading(false);
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

    const [metadataError, metadataResult] = await tryAsync(pinFile(file));
    setUploading(false);

    if (metadataError !== undefined) {
      toast.error(metadataError.message || "Error uploading agent metadata");
      return null;
    }

    return metadataResult.cid;
  }

  async function onSubmit(data: RegisterAgentFormData): Promise<void> {
    if (!userHasEnoughBalance) {
      toast.error(
        `Insufficient balance. Required: ${formatToken(estimatedFee)} but got ${formatToken(accountFreeBalance.data ?? 0n)}`,
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Insufficient balance",
      });
      return;
    }

    const parsedAgentKey = checkSS58(data.agentKey);

    const parsedAgentApiUrl = z
      .string()
      .url()
      .safeParse(
        !data.agentApiUrl || data.agentApiUrl.trim() === ""
          ? "null:"
          : data.agentApiUrl,
      );
    if (!parsedAgentApiUrl.success) {
      toast.error(
        parsedAgentApiUrl.error.errors.map((e) => e.message).join(", "),
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error on form validation.",
      });
      return;
    }

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting agent creation...",
    });
    const cid = await doMetadataPin();
    if (cid == null) return;
    console.info("Pinned metadata at:", cidToIpfsUri(cid));

    const [registerError, _] = await tryAsync(
      registerAgentTransaction({
        agentKey: parsedAgentKey,
        name: data.name,
        url: parsedAgentApiUrl.data,
        metadata: cidToIpfsUri(cid),
        callback: (tx) => setTransactionStatus(tx),
      }),
    );

    if (registerError !== undefined) {
      toast.error(registerError.message || "Error registering agent");
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Failed to register agent",
      });
    }
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

  const handleTabChange = useCallback(
    async (tab: TabsViews) => {
      let isValid = true;

      if (tab === "about") {
        isValid = await trigger(["agentKey", "name", "shortDescription"]);
      }

      if (tab === "socials") {
        isValid = await trigger(["title", "body"]);
      }

      if (isValid) {
        setCurrentTab(tab);
      }
    },
    [trigger],
  );

  const formValues = watch();

  const aboutViewDisabled = useMemo(
    () =>
      !formValues.agentKey ||
      !formValues.name ||
      !formValues.shortDescription ||
      !userHasEnoughBalance ||
      !selectedAccount?.address,
    [
      formValues.agentKey,
      formValues.name,
      formValues.shortDescription,
      userHasEnoughBalance,
      selectedAccount?.address,
    ],
  );

  const socialsViewDisabled = useMemo(
    () => !formValues.title || !formValues.body || aboutViewDisabled,
    [formValues.title, formValues.body, aboutViewDisabled],
  );

  const registerViewDisabled = socialsViewDisabled;

  const links = getLinks(env("NEXT_PUBLIC_TORUS_CHAIN_ENV"));

  const renderTabButtons = () => {
    const tabOrder: TabsViews[] = [
      "agent-info",
      "about",
      "socials",
      "register",
    ];
    const currentIndex = tabOrder.indexOf(currentTab);

    const buttons = [];

    // Previous/Back button
    if (currentIndex > 0) {
      const prevTab = tabOrder[currentIndex - 1];
      buttons.push(
        <Button
          key="back"
          type="button"
          variant="outline"
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          onClick={() => setCurrentTab(prevTab!)}
          className="flex-1"
        >
          Back
        </Button>,
      );
    }

    // Next/Continue button or Submit button
    if (currentIndex < tabOrder.length - 1) {
      const nextTab = tabOrder[currentIndex + 1];
      const isDisabled =
        (nextTab === "about" && aboutViewDisabled) ||
        (nextTab === "socials" && socialsViewDisabled) ||
        (nextTab === "register" && registerViewDisabled);

      buttons.push(
        <Button
          key="next"
          type="button"
          disabled={isDisabled}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          onClick={() => handleTabChange(nextTab!)}
          className="flex-1"
        >
          Continue
        </Button>,
      );
    } else {
      // Final submit button for register tab
      buttons.push(
        <Button
          key="submit"
          type="submit"
          size="lg"
          variant="default"
          className="flex-1"
          disabled={registerViewDisabled}
        >
          {getButtonSubmitLabel({ uploading, isAccountConnected })}
        </Button>,
      );
    }

    return <div className="flex gap-2 w-full">{buttons}</div>;
  };

  return (
    <div className="w-full max-w-2xl p-6 min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Register Agent</h1>
        <p className="text-muted-foreground">
          Register your agent or module on the Torus Network
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 justify-between flex-1"
        >
          <div className="flex flex-col gap-4">
            <Tabs
              defaultValue="agent-info"
              value={currentTab}
              onValueChange={(tab) => handleTabChange(tab as TabsViews)}
            >
              <TabsList className="w-full rounded-full mb-4">
                <TabsTrigger value="agent-info" className="w-full rounded-full">
                  1. Agent
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  disabled={aboutViewDisabled}
                  className="w-full rounded-full"
                >
                  2. Metadata
                </TabsTrigger>
                <TabsTrigger
                  value="socials"
                  disabled={socialsViewDisabled}
                  className="w-full rounded-full"
                >
                  3. Socials
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  disabled={registerViewDisabled}
                  className="w-full rounded-full"
                >
                  4. Register
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="agent-info"
                className="animate-fade flex flex-col gap-6"
              >
                <FormField
                  control={control}
                  name="agentKey"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Agent Address</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="5D5Fb...REBnt"
                          type="text"
                          minLength={47}
                          maxLength={48}
                          required
                          title="Paste the same address that you used in your agent/module application!"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="agentApiUrl"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Agent API URL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://agent-one.com"
                          type="text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Agent Name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="My Agent's Name"
                          type="text"
                          required
                        />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-1">
                        Must start and end with alphanumeric characters. Can
                        contain lowercase letters, numbers, hyphens, and
                        underscores.
                      </p>
                      <FormMessage />
                      {formValues.name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Link
                            href={links.docs}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-foreground transition-colors"
                          >
                            <Info className="h-4 w-4" />
                          </Link>
                          Your name on the namespace: agent.{formValues.name}
                        </div>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="shortDescription"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        Short Description{" "}
                        <span className="text-muted-foreground text-sm">
                          (Max {AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters)
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder={`Max ${AGENT_SHORT_DESCRIPTION_MAX_LENGTH} characters`}
                          rows={1}
                          maxLength={AGENT_SHORT_DESCRIPTION_MAX_LENGTH}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent
                value="about"
                className="animate-fade flex flex-col gap-6"
              >
                <FormField
                  control={control}
                  name="title"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Agent Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="My Agent's Title"
                          type="text"
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="body"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Agent Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your agent (Markdown supported, HTML tags are not supported)"
                          rows={5}
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent
                value="socials"
                className="animate-fade flex flex-col gap-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:gap-4">
                  <FormField
                    control={control}
                    name="twitter"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1">
                        <FormLabel>X/Twitter</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="x.com/agent-profile"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="github"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1">
                        <FormLabel>Github</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="github.com/agent-repository"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:gap-4">
                  <FormField
                    control={control}
                    name="discord"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1">
                        <FormLabel>Discord</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="discord.gg/agent-server"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name="telegram"
                    render={({ field }) => (
                      <FormItem className="flex flex-col flex-1">
                        <FormLabel>Telegram</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="t.me/agent-profile"
                            type="text"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="www.agent-website.com"
                          type="text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="icon"
                  render={({ field: controllerField }) => (
                    <FormItem className="relative">
                      <FormControl>
                        <Controller
                          control={control}
                          name="icon"
                          render={({ field }) => (
                            <Dropzone
                              containerClassName="flex h-full w-full bg-dark cursor-pointer flex-col items-center justify-center gap-2 border-none"
                              dropZoneClassName="border-none"
                              onFileDialogOpen={() => field.onChange(undefined)}
                              onDrop={(acceptedFiles) => {
                                if (acceptedFiles[0]) {
                                  field.onChange(acceptedFiles[0]);
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
                                      Drop your file here!
                                    </div>
                                  )}
                                  {!controllerField.value &&
                                    !dropzone.isDragAccept &&
                                    dropzone.fileRejections.length === 0 && (
                                      <div className="flex flex-col items-center gap-1 text-sm font-medium">
                                        <span className="flex gap-2 text-nowrap">
                                          <FolderUp className="h-4 w-4" />
                                          Upload Agent Icon
                                        </span>
                                        <span className="text-center text-gray-400">
                                          Square Image (Max 512x512)
                                        </span>
                                      </div>
                                    )}
                                  {controllerField.value &&
                                    dropzone.fileRejections.length === 0 && (
                                      <div className="flex flex-col items-center gap-1 text-sm font-medium">
                                        <span className="flex gap-2 text-nowrap">
                                          <FolderUp className="h-4 w-4" />
                                          Click to change Icon
                                        </span>
                                        <span className="text-xs font-medium">
                                          {smallFilename(
                                            controllerField.value.name,
                                          )}
                                        </span>
                                        <span className="text-xs font-medium">
                                          {(
                                            controllerField.value.size / 1000
                                          ).toFixed(1)}{" "}
                                          KB
                                        </span>
                                        <Image
                                          className="absolute inset-0 h-full w-full object-cover opacity-20"
                                          src={URL.createObjectURL(
                                            controllerField.value,
                                          )}
                                          alt={controllerField.value.name}
                                          width={100}
                                          height={100}
                                        />
                                      </div>
                                    )}
                                  {dropzone.fileRejections.map(
                                    (fileRej, idx) => (
                                      <div
                                        key={idx}
                                        className="flex flex-col items-center gap-1 text-sm font-medium"
                                      >
                                        <span className="flex gap-1.5 text-nowrap">
                                          Rejected file:{" "}
                                          {smallFilename(fileRej.file.name)}
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
                                    ),
                                  )}
                                </div>
                              )}
                            </Dropzone>
                          )}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent
                value="register"
                className="animate-fade flex flex-col gap-6"
              >
                <div className="flex flex-col gap-4 lg:flex-row">
                  <div className="flex w-fit flex-col gap-2 lg:w-1/2">
                    <span>Agent Card Preview</span>
                    <AllocatorAgentItem
                      agentKey={getValues("agentKey")}
                      iconUrl={
                        getValues("icon")
                          ? URL.createObjectURL(
                              getValues("icon") ?? new File([], ""),
                            )
                          : null
                      }
                      socialsList={{
                        discord: getValues("discord"),
                        github: getValues("github"),
                        telegram: getValues("telegram"),
                        twitter: getValues("twitter"),
                        website: getValues("website"),
                      }}
                      shortDescription={getValues("shortDescription")}
                      title={getValues("name")}
                    />
                  </div>
                  <div className="flex w-full flex-col gap-2 lg:w-1/2">
                    <span>Agent Expanded Preview</span>
                    {getValues("body") && (
                      <MarkdownPreview
                        className="max-h-[44vh] w-full overflow-auto pb-4"
                        source={`# ${getValues("title")}\n${getValues("body")}`}
                        style={{
                          backgroundColor: "transparent",
                          color: "white",
                        }}
                      />
                    )}
                  </div>
                </div>
                {transactionStatus.status && (
                  <TransactionStatus
                    status={transactionStatus.status}
                    message={transactionStatus.message}
                  />
                )}
              </TabsContent>
            </Tabs>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5 text-start">
                {!userHasEnoughBalance &&
                  selectedAccount &&
                  estimatedFee !== 0n && (
                    <span className="text-sm text-red-400">
                      You don't have enough balance to submit an application.
                    </span>
                  )}
              </div>
            </div>
          </div>
          <div className="w-full mb-12 space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>
                Info: The registration fee will be deducted from your connected
                wallet.
              </AlertTitle>
              <AlertDescription className="flex flex-row gap-2 text-sm">
                <span className="text-white">
                  Application fee:{" "}
                  {selectedAccount ? (
                    <span className="text-muted-foreground">
                      {estimatedFee
                        ? `${fromNano(estimatedFee)} TORUS`
                        : "Loading..."}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      connect your wallet to calculate the fee.
                    </span>
                  )}
                </span>
              </AlertDescription>
            </Alert>
            {renderTabButtons()}
          </div>
        </form>
      </Form>
    </div>
  );
}
