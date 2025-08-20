"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useFileUploader } from "hooks/use-file-uploader";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { addGlobalCustomProposal } from "@torus-network/sdk/chain";
import { formatToken } from "@torus-network/torus-utils/torus/token";

import { useTorus } from "@torus-ts/torus-provider";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@torus-ts/ui/components/form";
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

const proposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export function CreateProposal() {
  const router = useRouter();
  const {
    isAccountConnected,
    accountFreeBalance,
    networkConfigs,
    selectedAccount,
  } = useGovernance();

  const { api, torusApi, wsEndpoint } = useTorus();
  const { web3FromAddress } = torusApi;

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    web3FromAddress,
    transactionType: "Create Custom Proposal",
  });
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("edit");
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

  const form = useForm<ProposalFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(proposalSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  });

  const { control, handleSubmit, getValues } = form;

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
    return accountFreeBalance.data > networkConfigs.data.proposalCost;
  })();

  const { uploadFile, uploading } = useFileUploader();

  async function handleFileUpload(fileToUpload: File): Promise<void> {
    const { success, cid } = await uploadFile(fileToUpload, {
      setTransactionStatus,
      errorMessage: "Error uploading agent application file",
    });

    if (!success || !cid) return;

    // Continue with your application logic
    if (!accountFreeBalance.data) {
      toast.error("Balance data is not available");
      return;
    }

    if (!networkConfigs.data) {
      toast.error("Network configs are still loading.");
      return;
    }

    const proposalCost = networkConfigs.data.proposalCost;

    const ipfsUri = `ipfs://${cid}`;
    if (Number(accountFreeBalance.data) > proposalCost) {
      if (!api || !sendTx) {
        toast.error("API not ready");
        return;
      }

      await sendTx(addGlobalCustomProposal(api, ipfsUri));

      // todo refetch handler
      const todoRefetcher = true;

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (todoRefetcher) {
        router.push("/proposals");
      }
    } else {
      toast.error(
        `Insufficient balance to create proposal. Required: ${proposalCost} but got ${formatToken(accountFreeBalance.data)}`,
      );
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Insufficient balance",
      });
      return;
    }

    router.refresh();
  }

  const onSubmit = async (data: ProposalFormData) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting proposal creation...",
    });

    const proposalData = JSON.stringify({
      title: data.title,
      body: data.body,
    });
    const blob = new Blob([proposalData], { type: "application/json" });
    const fileToUpload = new File([blob], "proposal.json", {
      type: "application/json",
    });
    await handleFileUpload(fileToUpload);
  };

  const getButtonSubmitLabel = ({
    uploading,
    isAccountConnected,
    isPending,
  }: {
    uploading: boolean;
    isAccountConnected: boolean;
    isPending: boolean;
  }) => {
    if (!isAccountConnected) {
      return "Connect a wallet to submit";
    }
    if (uploading) {
      return "Uploading...";
    }
    if (isPending) {
      return "Submitting...";
    }
    return "Submit Proposal";
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-3">
            <TabsTrigger value="edit">Edit Content</TabsTrigger>
            <TabsTrigger value="preview">Preview Content</TabsTrigger>
          </TabsList>
          <TabsContent value="edit" className="flex flex-col gap-3">
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Your proposal title here..."
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
                      placeholder="Your proposal body here... (Markdown supported / HTML tags are not supported)"
                      rows={5}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="preview" className="rounded-radius bg-muted p-3">
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

        <div className="text-muted-foreground flex flex-col items-start gap-2 text-sm">
          <span>
            Note: The proposal cost will be deducted from your connected wallet.
          </span>
          {!userHasEnoughBalance && (
            <span className="text-red-400">
              You don't have enough balance to submit a proposal.
            </span>
          )}
        </div>

        <Button
          size="lg"
          type="submit"
          variant="default"
          disabled={
            !userHasEnoughBalance ||
            !form.formState.isValid ||
            uploading ||
            isPending
          }
        >
          {getButtonSubmitLabel({ uploading, isAccountConnected, isPending })}
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
