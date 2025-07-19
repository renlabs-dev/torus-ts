"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useDiscordAuth } from "hooks/use-discord-auth";
import { useFileUploader } from "hooks/use-file-uploader";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { formatToken } from "@torus-network/torus-utils/torus/token";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { Button } from "@torus-ts/ui/components/button";
import { Checkbox } from "@torus-ts/ui/components/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Icons } from "@torus-ts/ui/components/icons";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { useGovernance } from "~/context/governance-provider";

import { DiscordAuthButton } from "../discord-auth-button";

const agentApplicationSchema = z.object({
  applicationKey: z.string().min(1, "Application Key is required"),
  discordId: z.string().min(1, "Discord ID is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  criteriaAgreement: z.boolean().refine((value) => value === true, {
    message: "You must agree to the requirements",
  }),
});

type AgentApplicationFormData = z.infer<typeof agentApplicationSchema>;

export function CreateAgentApplication() {
  const {
    isAccountConnected,
    AddAgentApplication,
    accountFreeBalance,
    agentApplications,
    selectedAccount,
    networkConfigs,
  } = useGovernance();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("edit");
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );
  const { discordId, signIn, isAuthenticated } = useDiscordAuth();

  // Load saved form data from localStorage
  const savedFormData =
    typeof window !== "undefined"
      ? localStorage.getItem("agentApplicationFormData")
      : null;

  let parsedFormData: Partial<AgentApplicationFormData> = {};
  if (savedFormData) {
    const [parseError, parsed] = trySync<Partial<AgentApplicationFormData>>(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      () => JSON.parse(savedFormData),
    );
    if (parseError !== undefined) {
      console.error("Error parsing saved form data:", parseError);
      localStorage.removeItem("agentApplicationFormData");
    } else {
      parsedFormData = parsed;
    }
  }

  const form = useForm<AgentApplicationFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(agentApplicationSchema),
    defaultValues: {
      applicationKey: parsedFormData.applicationKey ?? "",
      discordId: "",
      title: parsedFormData.title ?? "",
      body: parsedFormData.body ?? "",
      criteriaAgreement: parsedFormData.criteriaAgreement ?? false,
    },
    mode: "onChange",
  });

  const { control, handleSubmit, setValue, getValues, watch } = form;

  // Save form data to localStorage whenever it changes
  const watchedFields = watch([
    "applicationKey",
    "title",
    "body",
    "criteriaAgreement",
  ]);

  useEffect(() => {
    const formData = {
      applicationKey: watchedFields[0],
      title: watchedFields[1],
      body: watchedFields[2],
      criteriaAgreement: watchedFields[3],
    };
    localStorage.setItem("agentApplicationFormData", JSON.stringify(formData));
  }, [watchedFields]);

  // Update form when Discord ID changes
  useEffect(() => {
    if (discordId) {
      form.setValue("discordId", discordId);
      void form.trigger("discordId");
    }
  }, [discordId, form]);

  const userHasEnoughBalance = (() => {
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
  })();

  const refetchHandler = async () => {
    await agentApplications.refetch();
  };

  const { uploadFile, uploading } = useFileUploader();

  async function handleFileUpload(fileToUpload: File): Promise<void> {
    const { success, cid } = await uploadFile(fileToUpload, {
      setTransactionStatus,
      errorMessage: "Error uploading agent application file",
    });

    if (!success || !cid) return;

    if (!accountFreeBalance.data) {
      toast.error("Balance data is not available");
      return;
    }

    if (!networkConfigs.data) {
      toast.error("Network configs are still loading.");
      return;
    }
    const daoApplicationCost = networkConfigs.data.agentApplicationCost;

    if (accountFreeBalance.data > daoApplicationCost) {
      const ipfsUri = `ipfs://${cid}`;
      const [error, _] = await tryAsync(
        AddAgentApplication({
          applicationKey: getValues("applicationKey"),
          IpfsHash: ipfsUri,
          removing: false,
          callback: (tx) => setTransactionStatus(tx),
          refetchHandler,
        }),
      );
      if (error !== undefined) {
        toast.error(error.message || "Error submitting agent application");
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Failed to submit agent application",
        });
        return;
      }
    } else {
      toast.error(
        `Insufficient balance to create Agent Application. Required: ${daoApplicationCost} but got ${formatToken(accountFreeBalance.data)}`,
      );
    }
  }

  const onSubmit = async (data: AgentApplicationFormData) => {
    // Verify Discord membership before proceeding
    if (!discordId) {
      toast.error("Please connect your Discord account first");
      return;
    }

    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting Agent Application creation...",
    });

    const daoData = JSON.stringify({
      discord_id: discordId,
      title: data.title,
      body: data.body,
    });
    const blob = new Blob([daoData], { type: "application/json" });
    const fileToUpload = new File([blob], "dao.json", {
      type: "application/json",
    });
    await handleFileUpload(fileToUpload);

    // Clear localStorage after successful submission
    localStorage.removeItem("agentApplicationFormData");
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-row w-full gap-2">
          <FormField
            control={control}
            name="applicationKey"
            render={({ field }) => (
              <FormItem className="flex w-full flex-col gap-2 sm:flex-row">
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Agent address (SS58 e.g. 5D5F...EBnt)"
                    className="w-full placeholder:text-sm"
                    type="text"
                    required
                  />
                </FormControl>
                <Button
                  variant="outline"
                  type="button"
                  className="!m-0 w-full sm:w-fit"
                  onClick={() =>
                    setValue("applicationKey", selectedAccount?.address ?? "")
                  }
                >
                  Paste my address
                </Button>
                <FormMessage />
              </FormItem>
            )}
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
            {/* Discord ID Display */}

            {isAuthenticated && (
              <DiscordAuthButton
                variant="ghost"
                onSignOut={() => {
                  toast.success("Disconnected from Discord");
                }}
                onError={(error) => {
                  toast.error(error.message || "Failed to disconnect");
                }}
              />
            )}
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Application title"
                      title="Make sure it's sufficiently descriptive!"
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
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Application body... (Markdown supported, HTML tags are not supported)"
                      title="Make sure your application contains all the information necessary for the Curator DAO to decide on your application!"
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
            value="preview"
            className="rounded-radius bg-muted mt-0 p-4"
          >
            {getValues("body") ? (
              <MarkdownPreview
                className="max-h-[40vh] overflow-auto"
                source={`# ${getValues("title")}\n${getValues("body")}`}
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
              {formatToken(networkConfigs.data?.agentApplicationCost ?? 0)}{" "}
              TORUS
            </span>
          </span>
        </div>

        <div className="flex items-start gap-2 text-white md:items-center">
          <FormField
            control={control}
            name="criteriaAgreement"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    id="terms"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel htmlFor="terms" className="!mt-0 leading-normal">
                  My application meets all the{" "}
                  <Link
                    className="text-cyan-500 underline"
                    href="https://docs.torus.network/concepts/agent-application"
                    target="_blank"
                  >
                    requirements
                  </Link>{" "}
                  defined.
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="text-muted-foreground flex items-start gap-2 text-sm">
          <span className="text-sm">
            Note: The application fee will be deducted from your connected
            wallet. If your application get accepted the application fee will be
            refunded.
          </span>
        </div>
        {!userHasEnoughBalance && (
          <span className="text-sm text-red-400">
            You don't have enough free balance to submit an application.
          </span>
        )}

        {!isAuthenticated ? (
          <Button
            size="lg"
            type="button"
            variant="outline"
            className="flex items-center gap-2 bg-[#5865F2] text-white hover:bg-[#4752c4]"
            onClick={async () => {
              // Save dialog state to reopen after auth
              sessionStorage.setItem("shapeNetworkModalOpen", "true");
              const error = await signIn();
              if (error) {
                toast.error("Failed to authenticate with Discord");
                sessionStorage.removeItem("shapeNetworkModalOpen");
              }
            }}
          >
            <Icons.Discord className="h-5 w-5" />
            Validate your Discord account
          </Button>
        ) : (
          <Button
            size="lg"
            type="submit"
            variant="default"
            className="flex items-center gap-2"
            disabled={
              !userHasEnoughBalance || !form.formState.isValid || uploading
            }
          >
            {uploading ? "Awaiting Signature" : "Submit Application"}
          </Button>
        )}
        {transactionStatus.status && (
          <TransactionStatus
            status={transactionStatus.status}
            message={transactionStatus.message}
          />
        )}
      </form>
    </Form>
  );
}
