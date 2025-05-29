"use client";

import { useState, useEffect } from "react";
import { Button } from "@torus-ts/ui/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@torus-ts/ui/components/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

import ConstraintExamplesSelector from "./constraint-examples-selector";
import { useTorus } from "@torus-ts/torus-provider";
import {
  usePermissionsByGrantor,
  usePermission,
} from "@torus-ts/query-provider/hooks";
import type { SS58Address, PermissionId } from "@torus-network/sdk";
import { PlusIcon } from "lucide-react";
import type { ValidationError } from "./constraint-utils";

interface ConstraintControlsSheetProps {
  selectedExample: string;
  onLoadExample: (exampleId: string) => void;
  selectedPermissionId: string;
  onPermissionIdChange: (permissionId: string) => void;
  isSubmitDisabled: boolean;
  validationErrors: ValidationError[];
  submitButton: React.ReactNode;
}

export default function ConstraintControlsSheet({
  selectedExample,
  onLoadExample,
  selectedPermissionId,
  onPermissionIdChange,
  submitButton,
}: ConstraintControlsSheetProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { api, selectedAccount } = useTorus();

  const { data: permissionsByGrantor, isLoading: isLoadingPermissions } =
    usePermissionsByGrantor(api, selectedAccount?.address as SS58Address);

  const [permissionError, permissions] = permissionsByGrantor ?? [
    undefined,
    undefined,
  ];

  const hasPermissions = permissions && permissions.length > 0;
  const isWalletConnected = selectedAccount?.address != null;
  const shouldDisablePermissionSelect = !isWalletConnected || !hasPermissions;

  // Query selected permission details
  const {
    data: permissionDetailsResponse,
    isLoading: isLoadingPermissionDetails,
  } = usePermission(api, selectedPermissionId as PermissionId);

  const [permissionDetailsError, permissionDetails] =
    permissionDetailsResponse ?? [undefined, undefined];

  // Auto-select the last permission when permissions are loaded
  useEffect(() => {
    if (hasPermissions && !selectedPermissionId) {
      const lastPermission = permissions[permissions.length - 1];
      if (lastPermission) {
        onPermissionIdChange(lastPermission);
      }
    }
  }, [permissions, selectedPermissionId, onPermissionIdChange, hasPermissions]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen} modal={false}>
      <SheetTrigger asChild>
        <Button className="shadow-lg">
          <PlusIcon className="h-4 w-4 mr-1" />
          Create Constraint
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="md:w-96 w-full z-[75] flex flex-col justify-between h-full"
      >
        <div>
          <SheetHeader>
            <SheetTitle className="text-start">Constraint Controls</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col gap-6 py-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Permission</label>
              <Select
                value={selectedPermissionId}
                onValueChange={onPermissionIdChange}
                disabled={shouldDisablePermissionSelect}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !isWalletConnected
                        ? "Connect wallet to view permissions"
                        : isLoadingPermissions
                          ? "Loading permissions..."
                          : permissionError
                            ? "Error loading permissions"
                            : !hasPermissions
                              ? "No permissions available"
                              : "Select permission..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {permissions?.map((permissionId) => (
                    <SelectItem key={permissionId} value={permissionId}>
                      {permissionId.slice(0, 16)}...{permissionId.slice(-8)}
                    </SelectItem>
                  )) ?? []}
                </SelectContent>
              </Select>
              {permissionError && (
                <p className="text-xs text-red-500">
                  Error: {permissionError.message}
                </p>
              )}

              {/* Permission Details */}
              {selectedPermissionId && (
                <div className="mt-4 p-3 bg-accent border">
                  <h3 className="text-sm font-semibold mb-2">
                    Permission Details
                  </h3>
                  {isLoadingPermissionDetails ? (
                    <div className="text-xs text-muted-foreground">
                      Loading permission details...
                    </div>
                  ) : permissionDetailsError ? (
                    <div className="text-xs text-red-500">
                      Error loading permission details:{" "}
                      {permissionDetailsError.message}
                    </div>
                  ) : permissionDetails ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-medium">Grantor:</span>
                        <span className="ml-2 font-mono text-muted-foreground">
                          {permissionDetails.grantor.slice(0, 8)}...
                          {permissionDetails.grantor.slice(-6)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Grantee:</span>
                        <span className="ml-2 font-mono text-muted-foreground">
                          {permissionDetails.grantee.slice(0, 8)}...
                          {permissionDetails.grantee.slice(-6)}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Scope:</span>
                        <span className="ml-2 text-muted-foreground">
                          {Object.keys(permissionDetails.scope)[0]}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <span className="ml-2 text-muted-foreground">
                          {Object.keys(permissionDetails.duration)[0]}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Revocation:</span>
                        <span className="ml-2 text-muted-foreground">
                          {Object.keys(permissionDetails.revocation)[0]}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Created At:</span>
                        <span className="ml-2 text-muted-foreground">
                          Block #{permissionDetails.createdAt.toString()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Execution Count:</span>
                        <span className="ml-2 text-muted-foreground">
                          {permissionDetails.executionCount.toString() || "0"}
                        </span>
                      </div>
                    </div>
                  ) : selectedPermissionId ? (
                    <div className="text-xs text-red-500">
                      Failed to load permission details
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <ConstraintExamplesSelector
              selectedExample={selectedExample}
              onExampleSelect={onLoadExample}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>

        <SheetFooter>{submitButton}</SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
