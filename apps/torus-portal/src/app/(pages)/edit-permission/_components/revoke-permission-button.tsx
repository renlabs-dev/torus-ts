// Every single grantor/grantee terminology has been changed to delegator/recipient
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// This change affects UI labels, variable names, and function names throughout the codebase
// TODO : Ensure all grantor/grantee references are updated to delegator/recipient

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
import type { InferSelectModel } from "drizzle-orm";
import type {
  permissionsSchema,
  emissionPermissionsSchema,
  namespacePermissionsSchema,
} from "@torus-ts/db/schema";
import { match } from "rustie";

// Types for the new database structure
type PermissionData = InferSelectModel<typeof permissionsSchema>;
type EmissionPermissionData = InferSelectModel<
  typeof emissionPermissionsSchema
>;
type NamespacePermissionData = InferSelectModel<
  typeof namespacePermissionsSchema
>;

export interface PermissionWithDetails {
  permissions: PermissionData;
  emission_permissions: EmissionPermissionData | null;
  namespace_permissions: NamespacePermissionData | null;
}

interface RevokePermissionButtonProps {
  /** The selected permission ID */
  permissionId: string | null;
  /** The permission data from database (new structure) - takes precedence over permission */
  permissionData?: PermissionWithDetails | null;
  /** The permission contract data for checking revocation terms (legacy support) */
  permission?: PermissionContract | null;
  /** Current blockchain block number */
  currentBlock: bigint;
  /** Current user's address */
  userAddress: string;
  /** Callback called on successful revocation */
  onSuccess?: () => void;
}

export function RevokePermissionButton({
  permissionId,
  permissionData,
  permission,
  currentBlock,
  userAddress,
  onSuccess,
}: RevokePermissionButtonProps) {
  const { revokePermissionTransaction } = useTorus();
  const { toast } = useToast();
  const [isRevoking, setIsRevoking] = useState(false);

  // Get the permission type
  const getPermissionType = () => {
    if (permissionData) {
      if (permissionData.emission_permissions) return "Emission";
      if (permissionData.namespace_permissions) return "Capability";
      return "Unknown";
    }
    // Legacy support for PermissionContract
    if (permission) {
      return match(permission.scope)({
        Emission() {
          return "Emission";
        },
        Namespace() {
          return "Capability";
        },
        Curator() {
          return "Curator";
        },
      });
    }
    return "Unknown";
  };

  // Check if the user can revoke this permission
  const canRevoke = (() => {
    if (!permissionId) return false;

    // Use new database structure if available
    if (permissionData) {
      const perm = permissionData.permissions;
      const isDelegator = perm.grantorAccountId === userAddress;

      // Only delegators can revoke permissions, and only if revocation terms allow it
      if (!isDelegator) return false;

      switch (perm.revocationType) {
        case "revocable_by_grantor":
          return true;
        case "revocable_after":
          return perm.revocationBlockNumber
            ? currentBlock > perm.revocationBlockNumber
            : false;
        case "irrevocable":
          return false;
        case "revocable_by_arbiters":
          // For now, we don't support arbiter-based revocations in the UI
          return false;
        default:
          return false;
      }
    }

    // Legacy support for PermissionContract
    if (permission) {
      const isDelegator = permission.grantor === userAddress;

      // Only delegators can revoke permissions, and only if revocation terms allow it
      if (!isDelegator) return false;

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
    }

    return false;
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
    if (!permissionId) return "No permission selected";

    // Use new database structure if available
    if (permissionData) {
      const perm = permissionData.permissions;
      const isDelegator = perm.grantorAccountId === userAddress;
      if (!isDelegator) return "Only the delegator can revoke permissions";

      switch (perm.revocationType) {
        case "revocable_by_grantor":
          return null; // Can revoke
        case "revocable_after":
          if (
            perm.revocationBlockNumber &&
            currentBlock > perm.revocationBlockNumber
          ) {
            return null; // Can revoke
          }
          return `Permission can only be revoked after block ${perm.revocationBlockNumber?.toString() ?? "N/A"}`;
        case "irrevocable":
          return "This permission is irrevocable";
        case "revocable_by_arbiters":
          return "This permission requires arbiter approval to revoke";
        default:
          return "Unknown revocation type";
      }
    }

    // Legacy support for PermissionContract
    if (permission) {
      const isDelegator = permission.grantor === userAddress;
      if (!isDelegator) return "Only the delegator can revoke permissions";

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
    }

    return "No permission data available";
  };

  const disabledReason = getDisabledReason();

  return (
    <div className="flex items-center gap-3">
      {/* Show disabled reason when button is disabled */}
      {disabledReason && (
        <span className="text-sm text-muted-foreground">{disabledReason}</span>
      )}

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
              Are you sure you want to revoke this permission? This action
              cannot be undone and will immediately terminate the permission's
              effects.
              {(permissionData ?? permission) && (
                <span className="mt-2 text-sm">
                  <strong>Permission Details:</strong>
                  <br />
                  Type: {getPermissionType()}
                  <br />
                  Delegator:{" "}
                  {permissionData
                    ? permissionData.permissions.grantorAccountId
                    : permission?.grantor}
                  <br />
                  Recipient:{" "}
                  {permissionData
                    ? permissionData.permissions.granteeAccountId
                    : permission?.grantee}
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
    </div>
  );
}
