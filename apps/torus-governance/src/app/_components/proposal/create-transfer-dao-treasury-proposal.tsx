"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatToken, toNano } from "@torus-network/torus-utils/subspace";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
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
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { useGovernance } from "~/context/governance-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
    addDaoTreasuryTransferProposal,
    selectedAccount,
  } = useGovernance();

  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("edit");
  const [uploading, setUploading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<TransactionResult>(
    {
      status: null,
      message: null,
      finalized: false,
    },
  );

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

  async function uploadFile(fileToUpload: File): Promise<void> {
    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", fileToUpload);
      const res = await fetch("/api/files", {
        method: "POST",
        body: data,
      });
      const ipfs = (await res.json()) as { cid: string };
      setUploading(false);

      if (!ipfs.cid || ipfs.cid === "undefined") {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Error uploading transfer dao treasury proposal",
        });
        return;
      }

      if (!accountFreeBalance.data) {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Balance is still loading",
        });
        return;
      }

      const daoApplicationCost = 1000;

      if (Number(accountFreeBalance.data) > daoApplicationCost) {
        void addDaoTreasuryTransferProposal({
          value: getValues("value"),
          destinationKey: getValues("destinationKey"),
          data: `ipfs://${ipfs.cid}`,
          callback: (tx) => setTransactionStatus(tx),
        });
      } else {
        toast({
          title: "Uh oh! Something went wrong.",
          description: `Insufficient balance to create a transfer dao treasury proposal. Required: ${daoApplicationCost} but got ${formatToken(
            accountFreeBalance.data,
          )}`,
          duration: 10000,
        });
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message:
            "Insufficient balance to create transfer dao treasury proposal",
        });
      }
      router.refresh();
    } catch (e) {
      setUploading(false);
      toast({
        title: "Uh oh! Something went wrong.",
        description:
          e instanceof Error
            ? e.message
            : "Error uploading transfer dao treasury proposal",
      });
    }
  }

  const onSubmit = async (data: TransferDaoTreasuryProposalFormData) => {
    setTransactionStatus({
      status: "STARTING",
      finalized: false,
      message: "Starting transfer dao treasury proposal creation...",
    });

    const proposalData = JSON.stringify({
      title: data.title,
      body: data.body,
    });
    const blob = new Blob([proposalData], { type: "application/json" });
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
