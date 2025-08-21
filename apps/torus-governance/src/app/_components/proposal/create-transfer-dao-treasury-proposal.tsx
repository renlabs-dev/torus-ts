"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useFileUploader } from "hooks/use-file-uploader";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { addDaoTreasuryTransferProposal } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken, toNano } from "@torus-network/torus-utils/torus/token";

import { useTorus } from "@torus-ts/torus-provider";
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
import { Separator } from "@torus-ts/ui/components/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { Textarea } from "@torus-ts/ui/components/text-area";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

import { useGovernance } from "~/context/governance-provider";

const transferDaoTreasuryProposalSchema = z.object({
  destinationKey: z.string().min(1, "Destination is required"),
  value: z.string().min(1, "Value is required"),
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

type TransferDaoTreasuryProposalFormData = z.infer<
  typeof transferDaoTreasuryProposalSchema
>;

export function CreateTransferDaoTreasuryProposal() {
  const router = useRouter();
  const {
    networkConfigs,
    isAccountConnected,
    accountFreeBalance,
    selectedAccount,
  } = useGovernance();

  const { api, torusApi, wsEndpoint } = useTorus();

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Create Treasury Transfer Proposal",
  });

  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("edit");

  const form = useForm<TransferDaoTreasuryProposalFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(transferDaoTreasuryProposalSchema),
    defaultValues: {
      destinationKey: "",
      value: "",
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
    return accountFreeBalance.data > toNano(1000);
  })();

  const { uploadFile, uploading } = useFileUploader();
  const queryClient = useQueryClient();

  async function handleFileUpload(fileToUpload: File): Promise<void> {
    const { success, cid } = await uploadFile(fileToUpload, {
      errorMessage: "Error uploading agent application file",
    });

    if (!success || !cid) return;

    if (!accountFreeBalance.data) {
      toast.error("Balance is still loading");
      return;
    }

    const daoApplicationCost = 1000;
    const ipfsUri = `ipfs://${cid}`;

    if (Number(accountFreeBalance.data) > daoApplicationCost) {
      if (!api || !sendTx) {
        toast.error("API not ready");
        return;
      }

      const [sendErr, sendRes] = await sendTx(
        addDaoTreasuryTransferProposal(
          api,
          toNano(getValues("value")),
          getValues("destinationKey") as SS58Address,
          ipfsUri,
        ),
      );

      if (sendErr !== undefined) {
        return; // Error already handled by sendTx
      }

      const { tracker } = sendRes;

      tracker.on("finalized", () => {
        void queryClient.invalidateQueries({ queryKey: ["proposals"] });
        router.push("/proposals");
      });
    } else {
      toast.error(
        `Insufficient balance to create a transfer dao treasury proposal. Required: ${daoApplicationCost} but got ${formatToken(accountFreeBalance.data)}`,
      );

      return;
    }

    router.refresh();
  }

  const onSubmit = async (data: TransferDaoTreasuryProposalFormData) => {
    const proposalData = JSON.stringify({
      title: data.title,
      body: data.body,
    });
    const blob = new Blob([proposalData], { type: "application/json" });
    const fileToUpload = new File([blob], "dao.json", {
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
    return "Submit transfer dao treasury proposal";
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
              name="destinationKey"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Destination"
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
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Value"
                      type="text"
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Application title"
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
                      rows={5}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
          <TabsContent value="preview" className="rounded-radius bg-muted p-4">
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
          {!userHasEnoughBalance && selectedAccount && (
            <span className="text-red-400">
              You don't have enough balance to submit an application.
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
      </form>
    </Form>
  );
}
