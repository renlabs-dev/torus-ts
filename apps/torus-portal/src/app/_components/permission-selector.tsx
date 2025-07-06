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
import type { PermissionWithDetails } from "../(pages)/edit-permission/_components/revoke-permission-button";

interface PermissionSelectorProps {
  control: Control<{
    permissionId: string;
  }>;
  selectedPermissionId: string;
  onPermissionIdChange: (permissionId: string) => void;
  onPermissionDataChange?: (data: PermissionWithDetails | null) => void;
}

export function PermissionSelector(props: PermissionSelectorProps) {
  const { selectedAccount, isAccountConnected } = useTorus();

  const { data: permissionsData, error: permissionsError } =
    trpcApi.permission.allWithEmissionsAndNamespaces.useQuery(undefined, {
      enabled: !!selectedAccount?.address,
    });

  // Filter permissions for the current account
  const userPermissions = permissionsData?.filter(
    (item) =>
      item.permissions.grantorAccountId === selectedAccount?.address ||
      item.permissions.granteeAccountId === selectedAccount?.address,
  );

  const hasPermissions = userPermissions && userPermissions.length > 0;

  // Helper function to determine permission type
  const getPermissionType = (item: PermissionWithDetails | null) => {
    if (item?.emission_permissions) return "Emission";
    if (item?.namespace_permissions) return "Capability";
    return "Unknown";
  };

  // Prioritize grantor permissions for auto-selection
  const getDefaultPermissionId = () => {
    if (!userPermissions?.length) return null;

    // First try to find a grantor permission
    const grantorPermission = userPermissions.find(
      (item) => item.permissions.grantorAccountId === selectedAccount?.address,
    );

    if (grantorPermission) {
      return grantorPermission.permissions.permissionId;
    }

    // Fall back to first grantee permission
    const granteePermission = userPermissions.find(
      (item) => item.permissions.granteeAccountId === selectedAccount?.address,
    );

    return granteePermission?.permissions.permissionId ?? null;
  };

  const defaultPermissionId = getDefaultPermissionId();

  const selectedPermissionData = userPermissions?.find(
    (item) => item.permissions.permissionId === props.selectedPermissionId,
  );

  // Handle wallet switching - reset selection when account changes
  useEffect(() => {
    if (selectedAccount?.address) {
      // Clear current selection when wallet changes
      if (props.selectedPermissionId && userPermissions) {
        // Check if current selection is valid for new account
        const isCurrentSelectionValid = userPermissions.some(
          (item) =>
            item.permissions.permissionId === props.selectedPermissionId,
        );

        if (!isCurrentSelectionValid) {
          // Clear invalid selection
          props.onPermissionIdChange("");
        }
      }
    }
  }, [
    selectedAccount?.address,
    userPermissions,
    props.selectedPermissionId,
    props.onPermissionIdChange,
    props,
  ]);

  // Auto-select first permission when conditions are met
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

  // Update permission data when selection changes
  useEffect(() => {
    if (props.onPermissionDataChange) {
      props.onPermissionDataChange(selectedPermissionData ?? null);
    }
  }, [selectedPermissionData, props.onPermissionDataChange, props]);

  function getPlaceholderText() {
    if (!isAccountConnected) return "Connect wallet to view permissions";
    if (permissionsError) return "Error loading permissions";
    if (!hasPermissions) return "No permissions available";
    return "Select permission";
  }

  function getDetailRows() {
    if (!selectedPermissionData) return [];

    const permission = selectedPermissionData.permissions;
    const permissionType = getPermissionType(selectedPermissionData);

    return [
      {
        label: "Permission ID",
        value: smallAddress(permission.permissionId),
      },
      {
        label: "Type",
        value: permissionType,
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
                  // Update permission data immediately when selection changes
                  const newPermissionData = userPermissions?.find(
                    (item) => item.permissions.permissionId === value,
                  );
                  if (props.onPermissionDataChange) {
                    props.onPermissionDataChange(newPermissionData ?? null);
                  }
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
                    if (!userPermissions) return null;

                    // Separate permissions by role and deduplicate
                    const grantorPermissions = userPermissions.filter(
                      (item) =>
                        item.permissions.grantorAccountId ===
                        selectedAccount?.address,
                    );

                    // Filter out permissions where user is also grantor to avoid duplicates
                    const granteeOnlyPermissions = userPermissions.filter(
                      (item) =>
                        item.permissions.granteeAccountId ===
                          selectedAccount?.address &&
                        item.permissions.grantorAccountId !==
                          selectedAccount.address,
                    );

                    return (
                      <>
                        {granteeOnlyPermissions.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>As Grantee</SelectLabel>
                            {granteeOnlyPermissions.map((item) => {
                              const permissionId =
                                item.permissions.permissionId;
                              const permissionType = getPermissionType(item);
                              return (
                                <SelectItem
                                  key={permissionId}
                                  value={permissionId}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{smallAddress(permissionId)}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({permissionType})
                                    </span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectGroup>
                        )}
                        {grantorPermissions.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>As Grantor</SelectLabel>
                            {grantorPermissions.map((item) => {
                              const permissionId =
                                item.permissions.permissionId;
                              const permissionType = getPermissionType(item);
                              const isBothRoles =
                                selectedAccount &&
                                item.permissions.grantorAccountId ===
                                  selectedAccount.address &&
                                item.permissions.granteeAccountId ===
                                  selectedAccount.address;
                              return (
                                <SelectItem
                                  key={permissionId}
                                  value={permissionId}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{smallAddress(permissionId)}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({permissionType}
                                      {isBothRoles ? " - Both Roles" : ""})
                                    </span>
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
