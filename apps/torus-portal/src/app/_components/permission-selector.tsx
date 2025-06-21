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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";

interface PermissionSelectorProps {
  control: Control<{
    permissionId: string;
  }>;
  selectedPermissionId: string;
  onPermissionIdChange: (permissionId: string) => void;
}

export function PermissionSelector({
  control,
  selectedPermissionId,
  onPermissionIdChange,
}: PermissionSelectorProps) {
  const { selectedAccount, isAccountConnected } = useTorus();

  const { data: permissionsData, error: permissionsError } =
    trpcApi.permission.withConstraintsByGrantor.useQuery(
      { grantor: selectedAccount?.address ?? "" },
      { enabled: !!selectedAccount?.address },
    );

  const displayPermissions = permissionsData?.map(
    (item) => item.permission.permission_id,
  );

  const hasPermissions = displayPermissions && displayPermissions.length > 0;

  const lastPermissionId =
    hasPermissions && displayPermissions[displayPermissions.length - 1];

  const selectedPermissionData = permissionsData?.find(
    (item) => item.permission.permission_id === selectedPermissionId,
  );

  const hasConstraint = (permissionId: string): boolean => {
    const permission = permissionsData?.find(
      (item) => item.permission.permission_id === permissionId,
    );
    return !!permission?.constraint;
  };

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

  function getPlaceholderText() {
    if (!isAccountConnected) return "Connect wallet to view permissions";
    if (permissionsError) return "Error loading permissions";
    if (!hasPermissions) return "No permissions available";
    return "Select permission";
  }

  function getDetailRows() {
    if (!selectedPermissionData?.permissionDetails) return [];

    const details = selectedPermissionData.permissionDetails;

    return [
      {
        label: "Permission ID",
        value: smallAddress(selectedPermissionData.permission.permission_id),
      },
      {
        label: "Grantor",
        value: smallAddress(details.grantor_key),
      },
      {
        label: "Grantee",
        value: smallAddress(details.grantee_key),
      },
      {
        label: "Scope",
        value: details.scope,
      },
      {
        label: "Duration",
        value: details.duration?.toString() ?? "N/A",
      },
      {
        label: "Revocation",
        value: details.revocation.toString(),
      },
      {
        label: "Created At",
        value: details.createdAt.toLocaleDateString(),
      },
      {
        label: "Execution Count",
        value: details.execution_count.toString(),
      },
    ];
  }

  return (
    <div className="space-y-2">
      <FormField
        control={control}
        name="permissionId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Permission</FormLabel>
            <div className="flex items-center gap-2">
              <Select
                value={field.value}
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
                  {displayPermissions?.map((permissionId) => (
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

      {selectedPermissionId && selectedPermissionData?.permissionDetails && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold">
              Permission Details
            </CardTitle>
          </CardHeader>

          <CardContent className="text-xs p-4 pt-0">
            {getDetailRows().map((row) => (
              <div key={row.label}>
                <span className="font-medium">{row.label}:</span>
                <span className={"ml-2 text-muted-foreground"}>
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
