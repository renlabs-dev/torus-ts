"use client";

import { useState } from "react";

import { Trash2 } from "lucide-react";

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

interface RevokePermissionButtonProps {
  permissionId: string;
  onSuccess?: () => void;
}

export function RevokePermissionButton({
  permissionId,
  onSuccess,
}: RevokePermissionButtonProps) {
  const { toast } = useToast();
  const { isAccountConnected } = useTorus();
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);

    // Simulate revoke action
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Permission revoked successfully");
    onSuccess?.();
    setIsRevoking(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={!isAccountConnected || !permissionId || isRevoking}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Revoke Permission
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
          >
            Revoke
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
