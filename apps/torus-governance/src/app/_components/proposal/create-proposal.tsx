"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { formatToken } from "@torus-network/torus-utils/subspace";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
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

const proposalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
});

type ProposalFormData = z.infer<typeof proposalSchema>;

export function CreateProposal() {
  const router = useRouter();
  const {
    isAccountConnected,
    addCustomProposal,
    accountFreeBalance,
    networkConfigs,
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

  async function uploadFile(fileToUpload: File): Promise<void> {
    setUploading(true);
    
    // Create and send form data
    const data = new FormData();
    data.set("file", fileToUpload);
    
    const [fetchError, res] = await tryAsync(
      fetch("/api/files", {
        method: "POST",
        body: data,
      })
    );
    
    if (fetchError !== undefined) {
      setUploading(false);
      toast.error(fetchError.message || "Error uploading file");
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error uploading file",
      });
      return;
    }
    
    const [jsonError, ipfs] = await tryAsync(res.json() as Promise<{ cid: string }>);
    setUploading(false);
    
    if (jsonError !== undefined) {
      toast.error(jsonError.message || "Error parsing response");
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error parsing response",
      });
      return;
    }
    
    if (!ipfs.cid || ipfs.cid === "undefined") {
      toast.error("Error uploading proposal");
      setTransactionStatus({
        status: "ERROR",
        finalized: true,
        message: "Error uploading proposal to IPFS",
      });
      return;
    }

    if (!accountFreeBalance.data) {
      toast.error("Balance is still loading");
      return;
    }

    const proposalCost = networkConfigs.data?.proposalCost ?? 0;

    if (Number(accountFreeBalance.data) > proposalCost) {
      const [propError, _] = await tryAsync(
        addCustomProposal({
          IpfsHash: `ipfs://${ipfs.cid}`,
          callback: (tx) => setTransactionStatus(tx),
        })
      );
      
      if (propError !== undefined) {
        toast.error(propError.message || "Error creating proposal");
        setTransactionStatus({
          status: "ERROR",
          finalized: true,
          message: "Error creating proposal",
        });
        return;
      }
    } else {
      toast.error(`Insufficient balance to create proposal. Required: ${proposalCost} but got ${formatToken(accountFreeBalance.data)}`);
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
