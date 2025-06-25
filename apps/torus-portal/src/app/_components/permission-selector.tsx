"use client";

import { useEffect } from "react";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

export function PermissionSelector(props: PermissionSelectorProps) {
  const { selectedAccount, isAccountConnected } = useTorus();

  const { data: permissionsData, error: permissionsError } =
    trpcApi.permission.withConstraintsByGrantorAndGrantee.useQuery(
      { address: selectedAccount?.address ?? "" },
      { enabled: !!selectedAccount?.address },
    );

  const displayPermissions = permissionsData?.map(
    (item) => item.permission.permission_id,
  );

  const hasPermissions = displayPermissions && displayPermissions.length > 0;

  // Prioritize grantor permissions for auto-selection
  const getDefaultPermissionId = () => {
    if (!permissionsData?.length) return null;

    // First try to find a grantor permission
    const grantorPermission = permissionsData.find(
      (item) =>
        item.permissionDetails?.grantor_key === selectedAccount?.address,
    );

    if (grantorPermission) {
      return grantorPermission.permission.permission_id;
    }

    // Fall back to first grantee permission
    const granteePermission = permissionsData.find(
      (item) =>
        item.permissionDetails?.grantee_key === selectedAccount?.address,
    );

    return granteePermission?.permission.permission_id ?? null;
  };

  const defaultPermissionId = getDefaultPermissionId();

  const selectedPermissionData = permissionsData?.find(
    (item) => item.permission.permission_id === props.selectedPermissionId,
  );

  const hasConstraint = (permissionId: string): boolean => {
    const permission = permissionsData?.find(
      (item) => item.permission.permission_id === permissionId,
    );
    return !!permission?.constraint;
  };

  useEffect(() => {
    if (hasPermissions && !props.selectedPermissionId && defaultPermissionId) {
      props.onPermissionIdChange(defaultPermissionId);
    }
  }, [
    displayPermissions,
    props.selectedPermissionId,
    props.onPermissionIdChange,
    hasPermissions,
    defaultPermissionId,
    props,
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
        control={props.control}
        name="permissionId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Select Permission</FormLabel>
            <div className="flex items-center gap-2">
              <Select
                value={field.value}
                onValueChange={(value: string) => {
                  field.onChange(value);
                  props.onPermissionIdChange(value);
                }}
                disabled={!isAccountConnected || !hasPermissions}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={getPlaceholderText()} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(() => {
                    if (!permissionsData) return null;

                    // Separate permissions by role
                    const grantorPermissions = permissionsData.filter(
                      (item) =>
                        item.permissionDetails?.grantor_key ===
                        selectedAccount?.address,
                    );
                    const granteePermissions = permissionsData.filter(
                      (item) =>
                        item.permissionDetails?.grantee_key ===
                        selectedAccount?.address,
                    );

                    return (
                      <>
                        {granteePermissions.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>As Grantee</SelectLabel>
                            {granteePermissions.map((permissionItem) => {
                              const permissionId =
                                permissionItem.permission.permission_id;
                              return (
                                <SelectItem
                                  key={permissionId}
                                  value={permissionId}
                                >
                                  <div className="flex items-center gap-2">
                                    {hasConstraint(permissionId) && (
                                      <Grid2x2Check className="h-4 w-4 text-green-500" />
                                    )}
                                    <span>{smallAddress(permissionId)}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        )}
                        {grantorPermissions.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>As Grantor</SelectLabel>
                            {grantorPermissions.map((permissionItem) => {
                              const permissionId =
                                permissionItem.permission.permission_id;
                              return (
                                <SelectItem
                                  key={permissionId}
                                  value={permissionId}
                                >
                                  <div className="flex items-center gap-2">
                                    {hasConstraint(permissionId) && (
                                      <Grid2x2Check className="h-4 w-4 text-green-500" />
                                    )}
                                    <span>{smallAddress(permissionId)}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        )}
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
              {props.selectedPermissionId && (
                <CopyButton
                  copy={props.selectedPermissionId}
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

      {props.selectedPermissionId &&
        selectedPermissionData?.permissionDetails && (
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
