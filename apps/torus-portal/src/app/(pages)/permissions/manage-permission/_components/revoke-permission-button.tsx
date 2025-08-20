"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { match } from "rustie";

import { revokePermission } from "@torus-network/sdk/chain";

import { useTorus } from "@torus-ts/torus-provider";
import { useSendTransaction } from "@torus-ts/torus-provider/use-send-transaction";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@torus-ts/ui/components/alert-dialog";
import { Button } from "@torus-ts/ui/components/button";
import { useToast } from "@torus-ts/ui/hooks/use-toast";

interface RevokePermissionButtonProps {
  permissionId: string;
  onSuccess?: () => void;
}

export function RevokePermissionButton({
  permissionId,
  onSuccess,
}: RevokePermissionButtonProps) {
  const { toast } = useToast();
  const { api, torusApi, wsEndpoint, isAccountConnected, selectedAccount } =
    useTorus();

  const queryClient = useQueryClient();

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    wallet: torusApi,
    transactionType: "Revoke Permission",
  });

  const refreshData = async () => {
    await queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
    await queryClient.invalidateQueries({
      queryKey: ["permissions_by_grantor", selectedAccount?.address],
    });
    await queryClient.invalidateQueries({
      queryKey: ["permissions_by_grantee", selectedAccount?.address],
    });
  };

  const handleRevoke = async () => {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    const [sendErr, sendRes] = await sendTx(
      revokePermission(api, permissionId as `0x${string}`),
    );
    if (sendErr !== undefined) {
      // Error is already handled by useSendTransaction
      return;
    }
    const { tracker } = sendRes;

    // Subscribe to inBlock event (which includes both InBlock and Finalized variants)
    tracker.on("inBlock", (event) => {
      // Refresh data immediately when transaction is included in a block
      void refreshData();

      // Check if this is the Finalized variant and if execution was successful
      if (event.kind === "Finalized") {
        match(event.outcome)({
          Success: () => {
            onSuccess?.();
          },
          Failed: () => {
            // Transaction was finalized but failed execution
            // Don't call onSuccess
          },
        });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={!isAccountConnected || !permissionId || isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {isPending ? "Revoking..." : "Revoke Permission"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently revoke the
            permission.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
          >
            {isPending ? "Revoking..." : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
