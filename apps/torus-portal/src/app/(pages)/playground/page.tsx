"use client";

import { useState } from "react";

import type { TransactionResult } from "@torus-ts/torus-provider";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/send-transaction-v2";
import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { toast, useToast } from "@torus-ts/ui/hooks/use-toast";

import { tryCatch } from "~/utils/try-catch";

export default function PlaygroundPageNew() {
  const { api, selectedAccount, torusApi, wsEndpoint, isAccountConnected } =
    useTorus();
  const [remarkText, setRemarkText] = useState("");

  const web3FromAddress = torusApi.web3FromAddress;
  const { sendTx, isPending, isSuccess, isError, error } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    web3FromAddress,
    transactionType: "Remark",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    console.log("handleSubmit :: api", api);
    console.log("handleSubmit :: send", sendTx);

    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }
    const text = remarkText.trim();
    if (!text) {
      toast.error("Please enter a remark");
      return;
    }

    const tx = api.tx.system.remarkWithEvent(text);
    await sendTx(tx);
  }

  return RemarkForm({
    remarkText,
    setRemarkText,
    handleSubmit,
    isAccountConnected,
    isSending: isPending,
  });
}

export function PlaygroundPage() {
  const { toast } = useToast();
  const { isAccountConnected, remarkTransaction } = useTorus();
  const [remarkText, setRemarkText] = useState("");
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!remarkText.trim()) {
      toast.error("Please enter a remark");
      return;
    }

    debugger;

    setTransactionStatus("loading");

    const { error } = await tryCatch(
      remarkTransaction({
        remark: remarkText,
        callback: (result: TransactionResult) => {
          if (result.status === "SUCCESS" && result.finalized) {
            setTransactionStatus("success");
            toast.success("Remark sent successfully!");
            setRemarkText("");
          }

          if (result.status === "ERROR") {
            setTransactionStatus("error");
            toast.error(result.message ?? "Failed to send remark");
          }
        },
        refetchHandler: async () => {
          // No-op for now
        },
      }),
    );

    if (error) {
      console.error("Error sending remark:", error);
      setTransactionStatus("error");
      toast.error("Failed to send remark");
    }
  };

  return RemarkForm({
    remarkText,
    setRemarkText,
    handleSubmit,
    isAccountConnected,
    isSending: transactionStatus === "loading",
  });
}

function RemarkForm({
  remarkText,
  setRemarkText,
  handleSubmit,
  isAccountConnected,
  isSending,
}: {
  remarkText: string;
  setRemarkText: (text: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isAccountConnected: boolean;
  isSending: boolean;
}) {
  return (
    <div className="max-w-md mx-auto mt-8 p-6 border rounded-lg">
      <h1 className="text-2xl font-bold mb-6">Send Remark</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="remark">Remark Text</Label>
          <Input
            id="remark"
            type="text"
            value={remarkText}
            onChange={(e) => setRemarkText(e.target.value)}
            placeholder="Enter your remark..."
            disabled={isSending}
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!isAccountConnected || !remarkText.trim() || isSending}
        >
          {isSending ? "Sending..." : "Send Remark"}
        </Button>
      </form>

      {!isAccountConnected && (
        <p className="text-sm text-muted-foreground mt-4">
          Please connect your wallet to send a remark.
        </p>
      )}
    </div>
  );
}
