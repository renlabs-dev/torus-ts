"use client";

import { useState } from "react";

import type { InferSelectModel } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import type {
  emissionPermissionsSchema,
  namespacePermissionsSchema,
  permissionsSchema,
} from "@torus-ts/db/schema";
import { useTorus } from "@torus-ts/torus-provider";
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

import { tryCatch } from "~/utils/try-catch";

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
  permissionId: string;
  onSuccess?: () => void;
}

export function RevokePermissionButton({
  permissionId,
  onSuccess,
}: RevokePermissionButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAccountConnected, revokePermissionTransaction, selectedAccount } = useTorus();
  const [transactionStatus, setTransactionStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleRevoke = async () => {
    setTransactionStatus("loading");

    const { error } = await tryCatch(
      revokePermissionTransaction({
        permissionId: permissionId as `0x${string}`,
        callback: (result) => {
          if (result.status === "SUCCESS" && result.finalized) {
            setTransactionStatus("success");
            onSuccess?.();
          }

          if (result.status === "ERROR") {
            setTransactionStatus("error");
            toast.error(result.message ?? "Failed to revoke permission");
          }
        },
        refetchHandler: async () => {
          // Invalidate all permission-related queries to ensure UI updates
          await queryClient.invalidateQueries({ queryKey: ["permissions"] });
          await queryClient.invalidateQueries({ queryKey: ["permissions_by_grantor", selectedAccount?.address] });
          await queryClient.invalidateQueries({ queryKey: ["permissions_by_grantee", selectedAccount?.address] });
        },
      }),
    );

    if (error) {
      console.error("Error revoking permission:", error);
      setTransactionStatus("error");
      toast.error("Failed to revoke permission");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={
            !isAccountConnected ||
            !permissionId ||
            transactionStatus === "loading"
          }
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {transactionStatus === "loading"
            ? "Revoking..."
            : "Revoke Permission"}
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
            disabled={transactionStatus === "loading"}
          >
            {transactionStatus === "loading" ? "Revoking..." : "Revoke"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
