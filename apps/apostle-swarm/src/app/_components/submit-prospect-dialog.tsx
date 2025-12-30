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
import { useIsApostle } from "~/hooks/use-is-apostle";
import { api } from "~/trpc/react";
import { useState } from "react";
import { toast } from "sonner";

const STAKE_THRESHOLD = 1_000_000_000_000n; // 1 TORUS

export function SubmitProspectDialog() {
  const [open, setOpen] = useState(false);
  const [xHandle, setXHandle] = useState("");

  const { api: torusApi, selectedAccount, isAccountConnected } = useTorus();
  const { isApostle, isLoading: isApostleLoading } = useIsApostle();

  const balanceQuery = useBalance(
    torusApi,
    selectedAccount?.address as SS58Address,
  );

  const userStake = balanceQuery.data?.staked ?? 0n;
  const hasEnoughStake = userStake >= STAKE_THRESHOLD;

  // Apostles use addManualProspect (auto-approved), community uses submitCommunityProspect (pending)
  const communityMutation =
    api.apostleSwarm.submitCommunityProspect.useMutation({
      onSuccess: (data) => {
        toast.success(`Prospect @${data.xHandle} submitted for review`);
        setOpen(false);
        setXHandle("");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });

  const apostleMutation = api.apostleSwarm.addManualProspect.useMutation({
    onSuccess: (data) => {
      toast.success(`Prospect @${data.xHandle} added and approved`);
      setOpen(false);
      setXHandle("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isPending = communityMutation.isPending || apostleMutation.isPending;

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

    if (isApostle) {
      apostleMutation.mutate({ xHandle: trimmedHandle });
    } else {
      communityMutation.mutate({ xHandle: trimmedHandle });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      setXHandle("");
    }
    setOpen(newOpen);
  };

  // Apostles don't need stake, community members do
  const canSubmit = isApostle || hasEnoughStake;

  const isSubmitDisabled =
    !isAccountConnected ||
    !canSubmit ||
    !xHandle.trim() ||
    isPending ||
    isApostleLoading;

  const getStatusMessage = () => {
    if (!isAccountConnected) {
      return "Connect your wallet to submit a prospect";
    }
    if (isApostleLoading) {
      return "Checking apostle status...";
    }
    if (isApostle) {
      return "As an apostle, your prospects are automatically approved.";
    }
    if (!hasEnoughStake) {
      return `You need at least ${formatToken(STAKE_THRESHOLD)} TORUS staked to submit prospects. Current stake: ${formatToken(userStake)} TORUS`;
    }
    return "Your submission will be reviewed by an apostle before approval.";
  };

  const statusMessage = getStatusMessage();

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button size="lg">Submit Prospect</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isApostle ? "Add Prospect" : "Submit a Prospect"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isApostle
              ? "Add an X handle directly as an approved prospect."
              : "Submit an X handle as a potential prospect for the swarm to evaluate."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm">{statusMessage}</p>

          <div className="space-y-2">
            <Label htmlFor="x-handle">X Handle</Label>
            <Input
              id="x-handle"
              placeholder="username"
              value={xHandle}
              onChange={(e) => setXHandle(e.target.value)}
              disabled={!isAccountConnected || !canSubmit || isPending}
            />
            <p className="text-muted-foreground text-xs">
              Enter the X handle without the @ symbol
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isPending
              ? "Submitting..."
              : isApostle
                ? "Add Prospect"
                : "Submit"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
