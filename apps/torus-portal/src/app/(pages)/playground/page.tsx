"use client";

import { useState } from "react";
import Link from "next/link";

import type { InjectedAccountWithMeta } from "@polkadot/extension-inject/types";

import {
  parseTorusTokens,
  toRems,
} from "@torus-network/torus-utils/torus/token";

import type { TransactionResult } from "@torus-ts/torus-provider";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/send-transaction-v2";
import { Button } from "@torus-ts/ui/components/button";
import { Checkbox } from "@torus-ts/ui/components/checkbox";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { toast, useToast } from "@torus-ts/ui/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";

import { tryCatch } from "~/utils/try-catch";

export default function Playground() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          Transaction Testing Playground
        </h1>

        {/* Shared Connection Status */}
        <div className="mb-8">
          <ConnectionStatus />
        </div>

        {/* Forms Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="col-span-1">
            <OldTransferPlayground />
          </div>
          <div className="col-span-1">
            <NewTransferPlayground />
          </div>
        </div>

        {/* Additional Test Pages */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Available Test Pages</CardTitle>
              <CardDescription>
                Test different features and procedures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/playground/streams-received">
                <Button variant="outline" className="w-full">
                  Streams Received Test - /playground/streams-received
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function NewTransferPlayground() {
  const { api, selectedAccount, torusApi, wsEndpoint, isAccountConnected } =
    useTorus();
  const [recipient, setRecipient] = useState(
    "5CSPN5CCbxjEVyAjDqzdaerMxMAbkcex7KMME7vmFWxDXfLb",
  );
  const [amount, setAmount] = useState("1");
  const [useInvalidNonce, setUseInvalidNonce] = useState(false);

  const web3FromAddress = torusApi.web3FromAddress;
  const {
    sendTx,
    isSigning,
    isSubmitted,
    isPending,
    isSuccess,
    isFinalized,
    isError,
    isReverted,
    message,
    error,
    txHash,
  } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    web3FromAddress,
    transactionType: "Transfer",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const recipientAddress = recipient.trim();
    if (!recipientAddress) {
      toast.error("Please enter a recipient address");
      return;
    }

    const transferAmount = amount.trim();
    if (!transferAmount) {
      toast.error("Please enter a valid amount");
      return;
    }

    let remAmount: bigint;
    try {
      // Parse the amount using parseTorusTokens and convert to Rems
      const torAmount = parseTorusTokens(transferAmount);
      remAmount = toRems(torAmount);
    } catch {
      toast.error("Invalid amount format");
      return;
    }

    const tx = api.tx.balances.transferAllowDeath(
      recipientAddress,
      remAmount.toString(),
    );

    // If checkbox is checked, use an invalid nonce to cause an error
    if (useInvalidNonce) {
      // Use an invalid nonce (999999) that will likely cause the transaction to fail
      void sendTx(tx, { nonce: 999999 });
    } else {
      void sendTx(tx);
    }
  }

  return (
    <div className="p-6 border rounded-lg h-fit">
      <h1 className="text-2xl font-bold mb-6">Send Transfer (New Method)</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="recipient">Recipient Address</Label>
          <div className="flex gap-2">
            <Input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="5Grw...KutQY"
              disabled={isPending}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecipient(selectedAccount?.address ?? "")}
              disabled={!selectedAccount || isPending}
            >
              Self
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="amount">Amount (TORUS)</Label>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="invalid-nonce"
            checked={useInvalidNonce}
            onCheckedChange={(checked) =>
              setUseInvalidNonce(checked as boolean)
            }
            disabled={isPending}
          />
          <Label
            htmlFor="invalid-nonce"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed
              peer-disabled:opacity-70"
          >
            Use invalid nonce (causes error)
          </Label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !isAccountConnected ||
            !recipient.trim() ||
            !amount.trim() ||
            isPending
          }
        >
          {isPending ? "Sending..." : "Send Transfer"}
        </Button>
      </form>

      {!isAccountConnected && (
        <p className="text-sm text-muted-foreground mt-4">
          Please connect your wallet to send a transfer.
        </p>
      )}

      {/* Transaction Status Display */}
      <div className="mt-4 p-4 bg-muted/50 rounded-md space-y-2 text-sm">
        <div className="font-semibold text-muted-foreground">
          Transaction Status
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Signing:</span>
            <span className={isSigning ? "text-yellow-600" : "text-gray-400"}>
              {isSigning ? "In Progress" : "No"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Submitted:</span>
            <span className={isSubmitted ? "text-blue-600" : "text-gray-400"}>
              {isSubmitted ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Pending:</span>
            <span className={isPending ? "text-yellow-600" : "text-gray-400"}>
              {isPending ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Success:</span>
            <span className={isSuccess ? "text-green-600" : "text-gray-400"}>
              {isSuccess ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Finalized:</span>
            <span className={isFinalized ? "text-green-600" : "text-gray-400"}>
              {isFinalized ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Error:</span>
            <span className={isError ? "text-red-600" : "text-gray-400"}>
              {isError ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Reverted:</span>
            <span className={isReverted ? "text-orange-600" : "text-gray-400"}>
              {isReverted ? "Yes" : "No"}
            </span>
          </div>
          {message && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-muted-foreground">Message:</div>
              <div className="text-sm mt-1">{message}</div>
            </div>
          )}
          {error && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-muted-foreground">Error:</div>
              <div className="text-sm text-red-600 mt-1">{error.message}</div>
            </div>
          )}
          {txHash && (
            <div className="mt-2 pt-2 border-t">
              <div className="text-muted-foreground">Transaction Hash:</div>
              <div className="text-xs font-mono mt-1 break-all">{txHash}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==== Old Transaction Methods ====

export function OldTransferPlayground() {
  const { toast } = useToast();
  const { isAccountConnected, transfer, selectedAccount } = useTorus();
  const [recipient, setRecipient] = useState(
    "5CSPN5CCbxjEVyAjDqzdaerMxMAbkcex7KMME7vmFWxDXfLb",
  );
  const [amount, setAmount] = useState("1");
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient.trim()) {
      toast.error("Please enter a recipient address");
      return;
    }

    if (!amount.trim()) {
      toast.error("Please enter a valid amount");
      return;
    }

    setTransactionStatus("loading");

    const { error } = await tryCatch(
      transfer({
        to: recipient.trim(),
        amount: amount.trim(),
        callback: (result: TransactionResult) => {
          if (result.status === "SUCCESS" && result.finalized) {
            setTransactionStatus("success");
            toast.success("Transfer sent successfully!");
            // Keep the form values for easier re-testing
          }

          if (result.status === "ERROR") {
            setTransactionStatus("error");
            toast.error(result.message ?? "Failed to send transfer");
          }
        },
        refetchHandler: async () => {
          // No-op for now
        },
      }),
    );

    if (error) {
      console.error("Error sending transfer:", error);
      setTransactionStatus("error");
      toast.error("Failed to send transfer");
    }
  };

  return TransferForm({
    recipient,
    setRecipient,
    amount,
    setAmount,
    handleSubmit,
    isAccountConnected,
    isSending: transactionStatus === "loading",
    selectedAccount,
  });
}

function TransferForm({
  recipient,
  setRecipient,
  amount,
  setAmount,
  handleSubmit,
  isAccountConnected,
  isSending,
  selectedAccount,
  extra,
}: {
  recipient: string;
  setRecipient: (address: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isAccountConnected: boolean;
  isSending: boolean;
  selectedAccount: InjectedAccountWithMeta | null;
  extra?: React.ReactNode;
}) {
  return (
    <div className="p-6 border rounded-lg h-fit">
      <h1 className="text-2xl font-bold mb-6">Send Transfer (Old Method)</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="recipient">Recipient Address</Label>
          <div className="flex gap-2">
            <Input
              id="recipient"
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="5Grw...KutQY"
              disabled={isSending}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRecipient(selectedAccount?.address ?? "")}
              disabled={!selectedAccount || isSending}
            >
              Self
            </Button>
          </div>
        </div>

        <div>
          <Label htmlFor="amount">Amount (TORUS)</Label>
          <Input
            id="amount"
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.1"
            disabled={isSending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={
            !isAccountConnected ||
            !recipient.trim() ||
            !amount.trim() ||
            isSending
          }
        >
          {isSending ? "Sending..." : "Send Transfer"}
        </Button>
      </form>

      {!isAccountConnected && (
        <p className="text-sm text-muted-foreground mt-4">
          Please connect your wallet to send a transfer.
        </p>
      )}

      {extra}
    </div>
  );
}

function ConnectionStatus() {
  const { api, selectedAccount, isAccountConnected } = useTorus();

  return (
    <div className="mt-4 p-4 bg-muted/50 rounded-md space-y-2 text-sm">
      <div className="font-semibold text-muted-foreground">
        Connection Status
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">API:</span>
          <span className={api ? "text-green-600" : "text-red-600"}>
            {api ? "Connected" : "Not connected"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Account:</span>
          <span
            className={isAccountConnected ? "text-green-600" : "text-amber-600"}
          >
            {isAccountConnected
              ? selectedAccount?.address.slice(0, 8) + "..."
              : "Not connected"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <span
            className={isAccountConnected ? "text-green-600" : "text-amber-600"}
          >
            {isAccountConnected ? "Ready" : "Wallet not connected"}
          </span>
        </div>
      </div>
    </div>
  );
}
