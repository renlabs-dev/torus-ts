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
import { Copy } from "lucide-react";
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
    trpcApi.permission.byAccountId.useQuery(
      { accountId: selectedAccount?.address ?? "" },
      { enabled: !!selectedAccount?.address },
    );

  const hasPermissions = permissionsData && permissionsData.length > 0;

  // Prioritize grantor permissions for auto-selection
  const getDefaultPermissionId = () => {
    if (!permissionsData?.length) return null;

    // First try to find a grantor permission
    const grantorPermission = permissionsData.find(
      (permission) => permission.grantorAccountId === selectedAccount?.address,
    );

    if (grantorPermission) {
      return grantorPermission.permissionId;
    }

    // Fall back to first grantee permission
    const granteePermission = permissionsData.find(
      (permission) => permission.granteeAccountId === selectedAccount?.address,
    );

    return granteePermission?.permissionId ?? null;
  };

  const defaultPermissionId = getDefaultPermissionId();

  const selectedPermissionData = permissionsData?.find(
    (permission) => permission.permissionId === props.selectedPermissionId,
  );

  useEffect(() => {
    if (hasPermissions && !props.selectedPermissionId && defaultPermissionId) {
      props.onPermissionIdChange(defaultPermissionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasPermissions,
    props.selectedPermissionId,
    props.onPermissionIdChange,
    defaultPermissionId,
  ]);

  function getPlaceholderText() {
    if (!isAccountConnected) return "Connect wallet to view permissions";
    if (permissionsError) return "Error loading permissions";
    if (!hasPermissions) return "No permissions available";
    return "Select permission";
  }

  function getDetailRows() {
    if (!selectedPermissionData) return [];

    const permission = selectedPermissionData;

    return [
      {
        label: "Permission ID",
        value: smallAddress(permission.permissionId),
      },
      {
        label: "Grantor",
        value: smallAddress(permission.grantorAccountId),
      },
      {
        label: "Grantee",
        value: smallAddress(permission.granteeAccountId),
      },
      {
        label: "Duration",
        value:
          permission.durationType === "indefinite"
            ? "Indefinite"
            : `Until Block ${permission.durationBlockNumber?.toString() ?? "N/A"}`,
      },
      {
        label: "Revocation",
        value: permission.revocationType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase()),
      },
      {
        label: "Created At",
        value: permission.createdAt.toLocaleDateString(),
      },
      {
        label: "Execution Count",
        value: permission.executionCount.toString(),
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
                      (permission) =>
                        permission.grantorAccountId ===
                        selectedAccount?.address,
                    );
                    const granteePermissions = permissionsData.filter(
                      (permission) =>
                        permission.granteeAccountId ===
                        selectedAccount?.address,
                    );

                    return (
                      <>
                        {granteePermissions.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>As Grantee</SelectLabel>
                            {granteePermissions.map((permission) => {
                              const permissionId = permission.permissionId;
                              return (
                                <SelectItem
                                  key={permissionId}
                                  value={permissionId}
                                >
                                  <span>{smallAddress(permissionId)}</span>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        )}
                        {grantorPermissions.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>As Grantor</SelectLabel>
                            {grantorPermissions.map((permission) => {
                              const permissionId = permission.permissionId;
                              return (
                                <SelectItem
                                  key={permissionId}
                                  value={permissionId}
                                >
                                  <span>{smallAddress(permissionId)}</span>
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

      {props.selectedPermissionId && selectedPermissionData && (
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
