"use client";

import Link from "next/link";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";
import { useGovernance } from "~/context/governance-provider";
import { cidToIpfsUri, PIN_FILE_RESULT } from "@torus-ts/utils/ipfs";
import type { TransactionResult } from "@torus-ts/torus-provider/types";

const agentApplicationSchema = z.object({
  applicationKey: z.string().min(1, "Application Key is required"),
  discordId: z
    .string()
    .min(17, "Discord ID is too short")
    .max(20, "Discord ID is too long"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  criteriaAgreement: z.boolean().refine((value) => value === true, {
    message: "You must agree to the requirements",
  }),
});

type AgentApplicationFormData = z.infer<typeof agentApplicationSchema>;

export function CreateAgentApplication(): JSX.Element {
  const {
    isAccountConnected,
    AddAgentApplication,
    accountFreeBalance,
    agentApplications,
    selectedAccount,
    networkConfigs,
  } = useGovernance();

  const [activeTab, setActiveTab] = useState("edit");
  const [uploading, setUploading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const form = useForm<AgentApplicationFormData>({
    resolver: zodResolver(agentApplicationSchema),
    defaultValues: {
      applicationKey: "",
      discordId: "",
      title: "",
      body: "",
      criteriaAgreement: false,
    },
  });

  const { control, handleSubmit, setValue, getValues } = form;

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

  async function uploadFile(fileToUpload: File): Promise<void> {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const { cid } = PIN_FILE_RESULT.parse(await res.json());
      console.log(cid.toString());
      setUploading(false);

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
          applicationKey: getValues("applicationKey"),
          IpfsHash: cidToIpfsUri(cid),
          removing: false,
          callback: (tx) => setTransactionStatus(tx),
          refetchHandler,
        });
      } else {
        toast.error(
          `Insufficient balance to create Agent Application. Required: ${daoApplicationCost} but got ${formatToken(
            accountFreeBalance.data,
          )}`,
        );
      }
    } catch (e) {
      setUploading(false);
      console.error(e);
      toast.error("Error uploading Agent Application");
    }
  }

  const onSubmit = async (data: AgentApplicationFormData) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting Agent Application creation...",
    });

    const daoData = JSON.stringify({
      discord_id: data.discordId,
      title: data.title,
      body: data.body,
    });
    const blob = new Blob([daoData], { type: "application/json" });
    const fileToUpload = new File([blob], "dao.json", {
      type: "application/json",
    });
    await uploadFile(fileToUpload);
  };

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
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <FormField
            control={control}
            name="applicationKey"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2 sm:flex-row">
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
          <FormField
            control={control}
            name="discordId"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Discord ID (17-20 digits)"
                    type="text"
                    required
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 20);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
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
            className="rounded-radius mt-0 bg-muted p-4"
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

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="text-sm">
            Note: The application fee will be deducted from your connected
            wallet. If your application get accepted the application fee will be
            refunded.
          </span>
        </div>
        {!userHasEnoughBalance && (
          <span className="text-sm text-red-400">
            You don't have enough balance to submit an application.
          </span>
        )}
        <Button
          size="lg"
          type="submit"
          variant="default"
          className="flex items-center gap-2"
          disabled={!userHasEnoughBalance || !form.formState.isValid}
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
    </Form>
  );
}
