"use client";

import { useState } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { Button } from "@torus-ts/ui/components/button";
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
import { Trash2, Loader2 } from "lucide-react";
import type { PermissionContract } from "@torus-network/sdk";
import { match } from "rustie";

interface RevokePermissionButtonProps {
  /** The selected permission ID */
  permissionId: string | null;
  /** The permission contract data for checking revocation terms */
  permission: PermissionContract | null;
  /** Current blockchain block number */
  currentBlock: bigint;
  /** Current user's address */
  userAddress: string;
  /** Callback called on successful revocation */
  onSuccess?: () => void;
}

export function RevokePermissionButton({
  permissionId,
  permission,
  currentBlock,
  userAddress,
  onSuccess,
}: RevokePermissionButtonProps) {
  const { revokePermissionTransaction } = useTorus();
  const { toast } = useToast();
  const [isRevoking, setIsRevoking] = useState(false);

  // Check if the user can revoke this permission
  const canRevoke = (() => {
    if (!permission || !permissionId) return false;

    const isGrantor = permission.grantor === userAddress;

    // Only grantors can revoke permissions, and only if revocation terms allow it
    if (!isGrantor) return false;

    return match(permission.revocation)({
      RevocableByGrantor() {
        return true;
      },
      RevocableAfter(blockNumber) {
        return currentBlock > BigInt(blockNumber);
      },
      Irrevocable() {
        return false;
      },
      RevocableByArbiters() {
        // For now, we don't support arbiter-based revocations in the UI
        return false;
      },
    });
  })();

  const handleRevoke = async () => {
    if (!permissionId || !canRevoke) return;

    try {
      setIsRevoking(true);

      await revokePermissionTransaction({
        permissionId: permissionId as `0x${string}`,
        callback: (result) => {
          if (result.status === "SUCCESS" && result.finalized) {
            toast({
              title: "Success",
              description: "Permission revoked successfully",
            });
            onSuccess?.();
          } else if (result.status === "ERROR") {
            toast({
              title: "Error",
              description: result.message ?? "Failed to revoke permission",
              variant: "destructive",
            });
          }
          setIsRevoking(false);
        },
        refetchHandler: async () => {
          // Permission list will be automatically updated
        },
      });
    } catch (error) {
      console.error("Error revoking permission:", error);
      setIsRevoking(false);
      toast({
        title: "Error",
        description: "Failed to revoke permission",
        variant: "destructive",
      });
    }
  };

  // Get the reason why revocation is not allowed
  const getDisabledReason = () => {
    if (!permission || !permissionId) return "No permission selected";

    const isGrantor = permission.grantor === userAddress;
    if (!isGrantor) return "Only the grantor can revoke permissions";

    return match(permission.revocation)({
      RevocableByGrantor() {
        return null; // Can revoke
      },
      RevocableAfter(blockNumber) {
        if (currentBlock > BigInt(blockNumber)) {
          return null; // Can revoke
        }
        return `Permission can only be revoked after block ${blockNumber}`;
      },
      Irrevocable() {
        return "This permission is irrevocable";
      },
      RevocableByArbiters() {
        return "This permission requires arbiter approval to revoke";
      },
    });
  };

  const disabledReason = getDisabledReason();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={!canRevoke || isRevoking}
          title={disabledReason ?? "Revoke this permission"}
        >
          {isRevoking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Revoke Permission
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke Permission</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke this permission? This action cannot
            be undone and will immediately terminate the permission's effects.
            {permission && (
              <span className="mt-2 text-sm">
                <strong>Permission Details:</strong>
                <br />
                Grantor: {permission.grantor}
                <br />
                Grantee: {permission.grantee}
                <br />
                ID: {permissionId}
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            className="bg-red-600 hover:bg-red-700"
            disabled={isRevoking}
          >
            {isRevoking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Revoking...
              </>
            ) : (
              "Revoke Permission"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
