"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";

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
  const { web3FromAddress } = torusApi;

  const queryClient = useQueryClient();

  const { sendTx, isPending } = useSendTransaction({
    api,
    selectedAccount,
    wsEndpoint,
    web3FromAddress,
    transactionType: "Revoke Permission",
  });

  const handleRevoke = async () => {
    if (!api || !sendTx) {
      toast.error("API not ready");
      return;
    }

    await sendTx(revokePermission(api, permissionId as `0x${string}`));

    // todo refetch handler
    const todoRefetcher = true;

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (todoRefetcher) {
      onSuccess?.();
      await queryClient.invalidateQueries({ queryKey: ["user_permissions"] });
      await queryClient.invalidateQueries({
        queryKey: ["permissions_by_grantor", selectedAccount?.address],
      });
      await queryClient.invalidateQueries({
        queryKey: ["permissions_by_grantee", selectedAccount?.address],
      });
    }
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
