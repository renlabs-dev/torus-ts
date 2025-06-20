"use client";

import { useEffect } from "react";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { useTorus } from "@torus-ts/torus-provider";
import { Grid2x2Check, Copy } from "lucide-react";
import type { Control } from "react-hook-form";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { api as trpcApi } from "~/trpc/react";

interface DetailRowProps {
  label: string;
  value: string;
  isMono?: boolean;
  className?: string;
}

function DetailRow({ label, value, isMono = false, className = "" }: DetailRowProps) {
  return (
    <div>
      <span className="font-medium">{label}:</span>
      <span className={`ml-2 text-muted-foreground ${isMono ? "font-mono" : ""} ${className}`}>
        {value}
      </span>
    </div>
  );
}

interface PermissionSelectorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  name: string;
  selectedPermissionId: string;
  onPermissionIdChange: (permissionId: string) => void;
}

export default function PermissionSelector({
  control,
  name,
  selectedPermissionId,
  onPermissionIdChange,
}: PermissionSelectorProps) {
  const { selectedAccount, isAccountConnected } = useTorus();

  // Get permissions with constraints by grantor from database
  const {
    data: permissionsData,
    isLoading: isLoadingPermissions,
    error: permissionsError,
  } = trpcApi.permission.withConstraintsByGrantor.useQuery(
    { grantor: selectedAccount?.address ?? "" },
    { enabled: !!selectedAccount?.address },
  );

  // Filter only emission permissions and extract permission IDs
  const emissionPermissions =
    permissionsData?.filter(
      (item) => item.permissionDetails?.scope === "EMISSION",
    ) ?? [];

  const displayPermissions = emissionPermissions.map(
    (item) => item.permission.permission_id,
  );

  const hasPermissions = displayPermissions.length > 0;

  // Get the last permission (most recently created)
  const lastPermissionId = hasPermissions
    ? displayPermissions[displayPermissions.length - 1]
    : undefined;

  // Find selected permission details from the loaded data
  const selectedPermissionData = permissionsData?.find(
    (item) => item.permission.permission_id === selectedPermissionId,
  );

  // Helper function to check if a permission has a constraint
  const hasConstraint = (permissionId: string): boolean => {
    const permission = permissionsData?.find(
      (item) => item.permission.permission_id === permissionId,
    );
    return !!permission?.constraint;
  };

  // Auto-select the last permission when permissions are loaded
  useEffect(() => {
    if (hasPermissions && !selectedPermissionId && lastPermissionId) {
      onPermissionIdChange(lastPermissionId);
    }
  }, [
    displayPermissions,
    selectedPermissionId,
    onPermissionIdChange,
    hasPermissions,
    lastPermissionId,
  ]);

  const getPlaceholderText = () => {
    if (!isAccountConnected) return "Connect wallet to view permissions";
    if (isLoadingPermissions) return "Loading permissions...";
    if (permissionsError) return "Error loading permissions";
    if (!hasPermissions) return "No permissions available";
    return "Select permission";
  };

  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Permission</FormLabel>
            <div className="flex items-center gap-2">
              <Select
                value={field.value as string}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  onPermissionIdChange(value);
                }}
                disabled={!isAccountConnected || !hasPermissions}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={getPlaceholderText()} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {displayPermissions.map((permissionId) => (
                    <SelectItem key={permissionId} value={permissionId}>
                      <div className="flex items-center justify-between w-full">
                        {hasConstraint(permissionId) && (
                          <Grid2x2Check className="h-4 w-4 text-green-500 mr-2" />
                        )}
                        <span>{smallAddress(permissionId)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPermissionId && (
                <CopyButton
                  copy={selectedPermissionId}
                  variant="outline"
                  className="h-9 px-2"
                  message="Permission ID copied to clipboard."
                >
                  <Copy className="h-3 w-3" />
                </CopyButton>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Permission Details */}
      {selectedPermissionId && selectedPermissionData && (
        <div className="mt-4 p-3 bg-accent border">
          <h3 className="text-sm font-semibold mb-2">Permission Details</h3>
          {selectedPermissionData.permissionDetails ? (
            <div className="space-y-2 text-xs">
              <DetailRow
                label="Permission ID"
                value={smallAddress(selectedPermissionData.permission.permission_id)}
                isMono
              />
              <DetailRow
                label="Grantor"
                value={smallAddress(selectedPermissionData.permissionDetails.grantor_key)}
                isMono
              />
              <DetailRow
                label="Grantee"
                value={smallAddress(selectedPermissionData.permissionDetails.grantee_key)}
                isMono
              />
              <DetailRow
                label="Scope"
                value={selectedPermissionData.permissionDetails.scope}
              />
              <DetailRow
                label="Duration"
                value={selectedPermissionData.permissionDetails.duration?.toString() ?? "N/A"}
              />
              <DetailRow
                label="Revocation"
                value={selectedPermissionData.permissionDetails.revocation.toString()}
              />
              <DetailRow
                label="Created At"
                value={selectedPermissionData.permissionDetails.createdAt.toLocaleDateString()}
              />
              <DetailRow
                label="Execution Count"
                value={selectedPermissionData.permissionDetails.execution_count.toString()}
              />
              {selectedPermissionData.constraint && (
                <DetailRow
                  label="Has Constraint"
                  value="✓ Yes"
                  className="text-green-600"
                />
              )}
            </div>
          ) : (
            <div className="text-xs text-red-500">
              Permission details not available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
