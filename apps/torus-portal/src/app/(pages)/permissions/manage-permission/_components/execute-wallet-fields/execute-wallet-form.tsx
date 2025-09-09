"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { executeWalletStakePermission } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import { Form } from "@torus-ts/ui/components/form";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { OperationTypeField } from "./operation-type-field";
import { UnstakeFields } from "./unstake-fields";
import { TransferFields } from "./transfer-fields";
import type { ExecuteWalletFormData } from "./execute-wallet-schema";
import { EXECUTE_WALLET_SCHEMA } from "./execute-wallet-schema";

interface ExecuteWalletFormProps extends React.ComponentProps<"form"> {
  permissionId: string;
  onSuccess?: () => void;
}

export function ExecuteWalletForm({
  className,
  permissionId,
  onSuccess,
  ...props
}: ExecuteWalletFormProps) {
  const { toast } = useToast();
  const {
    api,
    isAccountConnected,
    selectedAccount,
    torusApi,
    wsEndpoint,
  } = useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Execute Wallet Stake Permission",
  });

  const form = useForm<ExecuteWalletFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(EXECUTE_WALLET_SCHEMA),
    mode: "onChange",
    defaultValues: {
      operationType: "Unstake",
      unstakeData: {
        staked: "",
        amount: "",
      },
      transferData: {
        from: "",
        to: "",
        amount: "",
      },
    },
  });

  const operationType = form.watch("operationType");

  const handleSubmit = useCallback(
    async (data: z.infer<typeof EXECUTE_WALLET_SCHEMA>) => {
      if (!api || !sendTx) {
        toast.error("API not ready");
        return;
      }

      // Build the operation based on the operation type
      const operation =
        data.operationType === "Unstake"
          ? {
              Unstake: {
                staked: data.unstakeData.staked as SS58Address,
                amount: BigInt(data.unstakeData.amount),
              },
            }
          : {
              Transfer: {
                from: data.transferData.from as SS58Address,
                to: data.transferData.to as SS58Address,
                amount: BigInt(data.transferData.amount),
              },
            };

      const [sendErr, sendRes] = await sendTx(
        executeWalletStakePermission({
          api,
          permissionId: permissionId as `0x${string}`,
          operation,
        }),
      );

      if (sendErr !== undefined) {
        return; // Error already handled by sendTx
      }

      const { tracker } = sendRes;

      tracker.on("finalized", () => {
        toast.success("Wallet stake operation executed successfully!");
        form.reset();
        onSuccess?.();
      });
    },
    [api, sendTx, permissionId, toast, form, onSuccess],
  );

  if (!permissionId) {
    return null;
  }

  return (
    <Form {...form}>
      <form
        {...props}
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn("flex flex-col gap-6", className)}
      >
        <OperationTypeField control={form.control} />

        {operationType === "Unstake" && (
          <UnstakeFields control={form.control} isAccountConnected={isAccountConnected} />
        )}

        {operationType === "Transfer" && (
          <TransferFields control={form.control} isAccountConnected={isAccountConnected} />
        )}

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={
            !isAccountConnected ||
            isPending ||
            isSigning
          }
        >
          {isPending || isSigning
            ? "Executing..."
            : `Execute ${operationType} Operation`}
        </Button>
      </form>
    </Form>
  );
}