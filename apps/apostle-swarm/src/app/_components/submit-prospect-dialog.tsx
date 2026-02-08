"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { SS58Address } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { PROSPECT_SUBMIT_SCHEMA } from "@torus-ts/api/apostle-swarm-schemas";
import { useBalance } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@torus-ts/ui/components/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { Input } from "@torus-ts/ui/components/input";
import { useIsApostle } from "~/hooks/use-is-apostle";
import { api } from "~/trpc/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { RenaissanceButton } from "./renaissance-button";

const STAKE_THRESHOLD = 0; // 1 TORUS

export function SubmitProspectDialog() {
  const [open, setOpen] = useState(false);

  const { api: torusApi, selectedAccount, isAccountConnected } = useTorus();
  const { isApostle, isLoading: isApostleLoading } = useIsApostle();

  const balanceQuery = useBalance(
    torusApi,
    selectedAccount?.address as SS58Address,
  );

  const userStake = balanceQuery.data?.staked ?? 0n;
  const hasEnoughStake = userStake >= STAKE_THRESHOLD;

  const form = useForm<z.infer<typeof PROSPECT_SUBMIT_SCHEMA>>({
    resolver: zodResolver(PROSPECT_SUBMIT_SCHEMA),
    defaultValues: {
      xHandle: "",
    },
  });

  const communityMutation =
    api.apostleSwarm.submitCommunityProspect.useMutation();

  const apostleMutation = api.apostleSwarm.addManualProspect.useMutation();

  const isPending = communityMutation.isPending || apostleMutation.isPending;

  async function onSubmit(data: z.infer<typeof PROSPECT_SUBMIT_SCHEMA>) {
    const mutation = isApostle
      ? apostleMutation.mutateAsync(data)
      : communityMutation.mutateAsync(data);

    const [error, result] = await tryAsync(mutation);

    if (error !== undefined) {
      toast.error(error.message);
      return;
    }

    const message = isApostle
      ? `Prospect @${result.xHandle} added and approved`
      : `Prospect @${result.xHandle} submitted for review`;

    toast.success(message);
    form.reset();
    setOpen(false);
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isPending) {
      form.reset();
    }
    setOpen(newOpen);
  };

  // Apostles don't need stake, community members do
  const canSubmit = isApostle || hasEnoughStake;

  const isSubmitDisabled =
    !isAccountConnected || !canSubmit || isPending || isApostleLoading;

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
        <RenaissanceButton size="lg" variant="secondary">
          Submit Prospect
        </RenaissanceButton>
      </AlertDialogTrigger>
      <AlertDialogContent className="renaissance-dialog max-w-md border-none bg-transparent shadow-none">
        <span className="renaissance-dialog-bottom-corners" />
        <span className="renaissance-dialog-filigree" />

        <AlertDialogHeader>
          <AlertDialogTitle className="renaissance-dialog-title">
            {isApostle ? "Add Prospect" : "Submit a Prospect"}
          </AlertDialogTitle>
          <AlertDialogDescription className="renaissance-dialog-description">
            {isApostle
              ? "Add an X handle directly as an approved prospect."
              : "Submit an X handle as a potential prospect for the swarm to evaluate."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <p className="text-sm italic" style={{ color: "hsl(30 20% 55%)" }}>
              {statusMessage}
            </p>

            <FormField
              control={form.control}
              name="xHandle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="renaissance-label">X Handle</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="renaissance-input"
                      placeholder="username"
                      disabled={!isAccountConnected || !canSubmit || isPending}
                    />
                  </FormControl>
                  <FormMessage />
                  <p
                    className="text-xs italic"
                    style={{ color: "hsl(30 15% 45%)" }}
                  >
                    Enter the X handle without the @ symbol
                  </p>
                </FormItem>
              )}
            />

            <div className="renaissance-separator" />

            <AlertDialogFooter className="pt-4">
              <RenaissanceButton
                type="button"
                variant="secondary"
                onClick={() => handleOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </RenaissanceButton>
              <RenaissanceButton type="submit" disabled={isSubmitDisabled}>
                {isPending
                  ? "Submitting..."
                  : isApostle
                    ? "Add Prospect"
                    : "Submit"}
              </RenaissanceButton>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
