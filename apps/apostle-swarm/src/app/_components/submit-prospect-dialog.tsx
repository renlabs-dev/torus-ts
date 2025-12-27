"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus";
import { useBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@torus-ts/ui/components/alert-dialog";
import { Button } from "@torus-ts/ui/components/button";
import { Input } from "@torus-ts/ui/components/input";
import { Label } from "@torus-ts/ui/components/label";
import { api } from "~/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

const STAKE_THRESHOLD = 1_000_000_000_000n; // 1 TORUS

export function SubmitProspectDialog() {
  const [open, setOpen] = useState(false);
  const [xHandle, setXHandle] = useState("");

  const { api: torusApi, selectedAccount, isAccountConnected } = useTorus();
  const balanceQuery = useBalance(
    torusApi,
    selectedAccount?.address as SS58Address,
  );

  const userStake = balanceQuery.data?.staked ?? 0n;
  const hasEnoughStake = userStake >= STAKE_THRESHOLD;

  const submitMutation = api.apostleSwarm.submitCommunityProspect.useMutation({
    onSuccess: (data) => {
      toast.success(`Prospect @${data.xHandle} submitted successfully`);
      setOpen(false);
      setXHandle("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = () => {
    const trimmedHandle = xHandle.trim().replace(/^@/, "");

    if (!trimmedHandle) {
      toast.error("Please enter an X handle");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedHandle)) {
      toast.error(
        "Invalid X handle format. Use only letters, numbers, and underscores.",
      );
      return;
    }

    submitMutation.mutate({ xHandle: trimmedHandle });
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !submitMutation.isPending) {
      setXHandle("");
    }
    setOpen(newOpen);
  };

  const isSubmitDisabled =
    !isAccountConnected ||
    !hasEnoughStake ||
    !xHandle.trim() ||
    submitMutation.isPending;

  const getStatusMessage = () => {
    if (!isAccountConnected) {
      return "Connect your wallet to submit a prospect";
    }
    if (!hasEnoughStake) {
      return `You need at least ${formatToken(STAKE_THRESHOLD)} TORUS staked to submit prospects. Current stake: ${formatToken(userStake)} TORUS`;
    }
    return null;
  };

  const statusMessage = getStatusMessage();

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button>Submit Prospect</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Submit a Prospect</AlertDialogTitle>
          <AlertDialogDescription>
            Submit an X handle as a potential prospect for the swarm to
            evaluate.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {statusMessage !== null && (
            <p className="text-muted-foreground text-sm">{statusMessage}</p>
          )}

          <div className="space-y-2">
            <Label htmlFor="x-handle">X Handle</Label>
            <Input
              id="x-handle"
              placeholder="username"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              disabled={
                !isAccountConnected ||
                !hasEnoughStake ||
                submitMutation.isPending
              }
            />
            <p className="text-muted-foreground text-xs">
              Enter the X handle without the @ symbol
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {submitMutation.isPending ? "Submitting..." : "Submit"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
