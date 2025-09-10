"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { PermissionContract } from "@torus-network/sdk/chain";
import { executeWalletStakePermission } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import { Button } from "@torus-ts/ui/components/button";
import { Form } from "@torus-ts/ui/components/form";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { cn } from "@torus-ts/ui/lib/utils";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import type { ExecuteWalletFormData } from "./execute-wallet-schema";
import { EXECUTE_WALLET_SCHEMA } from "./execute-wallet-schema";
import { OperationTypeField } from "./operation-type-field";
import { TransferFields } from "./transfer-fields";
import { UnstakeFields } from "./unstake-fields";

export function ExecuteWalletForm({
  permissionId,
  permissionContract,
}: {
  permissionId: string;
  permissionContract: PermissionContract | null;
}) {
  const { toast } = useToast();
  const { api, isAccountConnected, selectedAccount, torusApi, wsEndpoint } =
    useTorus();

  const { sendTx, isPending, isSigning } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Execute Wallet Stake Permission",
  });

  // Get the recipient address and stake settings from the wallet permission
  const walletScope =
    permissionContract && "Wallet" in permissionContract.scope
      ? permissionContract.scope.Wallet
      : null;

  const walletRecipient = walletScope?.recipient || "";
  const walletDelegator = permissionContract?.delegator || "";
  const stakeSettings = walletScope?.r_type.Stake;
  const canTransferStake = stakeSettings?.canTransferStake || false;

  // Check access permissions
  const isDelegator =
    permissionContract?.delegator === selectedAccount?.address;
  const isRecipient = walletRecipient === selectedAccount?.address;

  // Recipients can execute wallet operations
  // Delegators cannot execute (they can only revoke if allowed)
  const canExecuteWallet = isRecipient && !isDelegator;

  const form = useForm<ExecuteWalletFormData>({
    disabled: !isAccountConnected,
    resolver: zodResolver(EXECUTE_WALLET_SCHEMA),
    mode: "onChange",
    defaultValues: {
      operationType: "Unstake",
      unstakeData: {
        staked: walletDelegator,
        amount: "",
      },
      transferData: {
        from: walletDelegator,
        to: "",
        amount: "",
      },
    },
  });

  const operationType = form.watch("operationType");

  async function handleSubmit(data: z.infer<typeof EXECUTE_WALLET_SCHEMA>) {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

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
      // form.reset();
    });
  }

  if (!permissionId) {
    return null;
  }

  // Only show the form if the user can execute wallet operations
  if (!canExecuteWallet) {
    return null;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit, (errors) => {
          console.log("Form validation errors:", errors);
        })}
        className={cn("mt-6 flex flex-col gap-6")}
      >
        <OperationTypeField
          control={form.control}
          canTransferStake={canTransferStake}
        />

        {operationType === "Unstake" && (
          <UnstakeFields
            control={form.control}
            isAccountConnected={isAccountConnected}
            api={api}
          />
        )}

        {operationType === "Transfer" && (
          <TransferFields
            control={form.control}
            isAccountConnected={isAccountConnected}
            api={api}
          />
        )}

        <Button
          type="submit"
          variant="outline"
          className="w-full"
          disabled={!isAccountConnected || isPending || isSigning}
        >
          {isPending || isSigning
            ? "Executing..."
            : `Execute ${operationType} Operation`}
        </Button>
      </form>
    </Form>
  );
}
