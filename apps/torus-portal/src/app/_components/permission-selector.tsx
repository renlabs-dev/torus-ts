"use client";

import React, { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Copy } from "lucide-react";
import type { Control } from "react-hook-form";

import type {
  PermissionContract,
  PermissionId,
  SS58Address,
} from "@torus-network/sdk";
import {
  CONSTANTS,
  queryPermissions,
  queryPermissionsByGrantee,
  queryPermissionsByGrantor,
} from "@torus-network/sdk";
import { smallAddress } from "@torus-network/torus-utils/subspace";

import { useTorus } from "@torus-ts/torus-provider";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

// Import the expected interface from the form
import type { PermissionWithDetails } from "../(pages)/permissions/edit-permission/_components/revoke-permission-button";

interface PermissionWithNetworkData {
  permissionId: string;
  contract: PermissionContract;
  namespacePaths?: string[];
}

interface PermissionSelectorProps {
  control: Control<{
    permissionId: string;
  }>;
  selectedPermissionId: string;
  onPermissionIdChange: (permissionId: string) => void;
  onPermissionDataChange?: (data: PermissionWithDetails | null) => void;
}

export function PermissionSelector(props: PermissionSelectorProps) {
  const { selectedAccount, isAccountConnected, api } = useTorus();

  // Get permission IDs where the user is the grantor
  const { data: grantorPermissionIds, isLoading: isLoadingGrantor } = useQuery({
    queryKey: ["permissions_by_grantor", selectedAccount?.address],
    queryFn: async () => {
      if (!api || !selectedAccount?.address) return null;
      const result = await queryPermissionsByGrantor(
        api,
        selectedAccount.address as SS58Address,
      );
      // Unwrap Result type
      const [error, data] = result;
      if (error) {
        console.error("Error querying grantor permissions:", error);
        return null;
      }
      return data;
    },
    enabled: !!api && !!selectedAccount?.address,
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
  });

  // Get permission IDs where the user is the grantee
  const { data: granteePermissionIds, isLoading: isLoadingGrantee } = useQuery({
    queryKey: ["permissions_by_grantee", selectedAccount?.address],
    queryFn: async () => {
      if (!api || !selectedAccount?.address) return null;
      const result = await queryPermissionsByGrantee(
        api,
        selectedAccount.address as SS58Address,
      );
      // Unwrap Result type
      const [error, data] = result;
      if (error) {
        console.error("Error querying grantee permissions:", error);
        return null;
      }
      return data;
    },
    enabled: !!api && !!selectedAccount?.address,
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
  });

  // Get all permissions with full details
  const {
    data: allPermissions,
    error: permissionsError,
    isLoading: isLoadingAll,
  } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      if (!api) return null;
      const result = await queryPermissions(api);
      // Unwrap Result type
      const [error, data] = result;
      if (error) {
        console.error("Error querying all permissions:", error);
        return null;
      }
      return data;
    },
    enabled: !!api,
    staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
  });

  // Combine and filter permissions for the current account
  const userPermissions = React.useMemo(() => {
    if (!allPermissions || permissionsError) return null;

    const userPermissionIds = new Set<PermissionId>();

    // Add grantor permission IDs (already unwrapped)
    if (grantorPermissionIds && Array.isArray(grantorPermissionIds)) {
      grantorPermissionIds.forEach((id: PermissionId) =>
        userPermissionIds.add(id),
      );
    }

    // Add grantee permission IDs (already unwrapped)
    if (granteePermissionIds && Array.isArray(granteePermissionIds)) {
      granteePermissionIds.forEach((id: PermissionId) =>
        userPermissionIds.add(id),
      );
    }

    // Filter all permissions to only include user's permissions
    const filtered: PermissionWithNetworkData[] = [];

    // allPermissions is already unwrapped and should be a Map
    if (allPermissions instanceof Map) {
      userPermissionIds.forEach((permissionId) => {
        const contract = allPermissions.get(permissionId);
        if (contract) {
          // Extract namespace paths if it's a namespace permission
          let namespacePaths: string[] | undefined;
          if ("Namespace" in contract.scope) {
            // The paths are zod-transformed strings, we need to cast them
            namespacePaths = contract.scope.Namespace
              .paths as unknown as string[];
          }
          filtered.push({ permissionId, contract, namespacePaths });
        }
      });
    }

    return filtered;
  }, [
    allPermissions,
    grantorPermissionIds,
    granteePermissionIds,
    permissionsError,
  ]);

  const hasPermissions = userPermissions && userPermissions.length > 0;

  // Helper function to determine permission type
  const getPermissionType = (contract: PermissionContract | null) => {
    if (!contract) return "Unknown";
    const scopeType = Object.keys(contract.scope)[0];
    if (scopeType === "Emission") return "Emission";
    if (scopeType === "Namespace") return "Capability";
    if (scopeType === "Curator") return "Curator";
    return "Unknown";
  };

  // Prioritize delegator permissions for auto-selection
  const getDefaultPermissionId = () => {
    if (!userPermissions?.length) return null;

    // First try to find a delegator permission
    const delegatorPermission = userPermissions.find(
      (item) =>
        item.contract.grantor === (selectedAccount?.address as SS58Address),
    );

    if (delegatorPermission) {
      return delegatorPermission.permissionId;
    }

    // Fall back to first recipient permission
    const recipientPermission = userPermissions.find(
      (item) =>
        item.contract.grantee === (selectedAccount?.address as SS58Address),
    );

    return recipientPermission?.permissionId ?? null;
  };

  const defaultPermissionId = getDefaultPermissionId();

  const selectedPermissionData = userPermissions?.find(
    (item) => item.permissionId === props.selectedPermissionId,
  );

  // Transform network data to match expected format
  const transformToPermissionWithDetails = (
    networkData: PermissionWithNetworkData | null,
  ): PermissionWithDetails | null => {
    if (!networkData) return null;

    const { permissionId, contract } = networkData;
    const scopeType = Object.keys(contract.scope)[0];
    const now = new Date();

    // Build the permissions object that matches the database schema
    const permissions: PermissionWithDetails["permissions"] = {
      id: permissionId, // Use permissionId as id for compatibility
      permissionId,
      grantorAccountId: contract.grantor,
      granteeAccountId: contract.grantee,
      durationType:
        Object.keys(contract.duration)[0] === "Indefinite"
          ? ("indefinite" as const)
          : ("until_block" as const),
      durationBlockNumber:
        "UntilBlock" in contract.duration
          ? BigInt(contract.duration.UntilBlock)
          : null,
      revocationType: (() => {
        const revType = Object.keys(contract.revocation)[0];
        if (revType === "Irrevocable") return "irrevocable";
        if (revType === "RevocableByGrantor") return "revocable_by_grantor";
        if (revType === "RevocableAfter") return "revocable_after";
        if (revType === "RevocableByArbiters") return "revocable_by_arbiters";
        return "irrevocable"; // Default to irrevocable instead of unknown
      })(),
      revocationBlockNumber:
        "RevocableAfter" in contract.revocation
          ? BigInt(contract.revocation.RevocableAfter)
          : null,
      revocationRequiredVotes:
        "RevocableByArbiters" in contract.revocation
          ? BigInt(contract.revocation.RevocableByArbiters.requiredVotes)
          : null,
      enforcementType:
        "None" in contract.enforcement
          ? ("none" as const)
          : ("controlled_by" as const),
      enforcementRequiredVotes:
        "ControlledBy" in contract.enforcement
          ? BigInt(contract.enforcement.ControlledBy.controllers.length)
          : null,
      lastExecutionBlock:
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        contract.lastExecution && "Some" in contract.lastExecution
          ? BigInt(contract.lastExecution.Some)
          : null,
      executionCount: Number(contract.executionCount),
      createdAtBlock: BigInt(contract.createdAt),
      createdAt: now, // Using current date as approximation
      updatedAt: now,
      deletedAt: null,
    };

    // Build emission permissions if applicable
    let emission_permissions: PermissionWithDetails["emission_permissions"] =
      null;
    if (scopeType === "Emission" && "Emission" in contract.scope) {
      const emissionScope = contract.scope.Emission;
      const allocationType = Object.keys(emissionScope.allocation)[0];
      const distributionType = Object.keys(emissionScope.distribution)[0];

      emission_permissions = {
        permissionId,
        allocationType:
          allocationType === "Streams"
            ? ("streams" as const)
            : ("fixed_amount" as const),
        fixedAmount:
          "FixedAmount" in emissionScope.allocation
            ? emissionScope.allocation.FixedAmount.toString()
            : null,
        distributionType: distributionType
          ? (distributionType
              .toLowerCase()
              .replace(/([A-Z])/g, "_$1")
              .toLowerCase()
              .slice(1) as "manual" | "at_block" | "automatic" | "interval")
          : "manual",
        distributionThreshold:
          "Automatic" in emissionScope.distribution
            ? emissionScope.distribution.Automatic.toString()
            : null,
        distributionTargetBlock:
          "AtBlock" in emissionScope.distribution
            ? BigInt(emissionScope.distribution.AtBlock)
            : null,
        distributionIntervalBlocks:
          "Interval" in emissionScope.distribution
            ? BigInt(emissionScope.distribution.Interval)
            : null,
        accumulating: emissionScope.accumulating,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
    }

    // Build namespace permissions if applicable
    let namespace_permissions: PermissionWithDetails["namespace_permissions"] =
      null;
    if (scopeType === "Namespace") {
      namespace_permissions = {
        permissionId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      };
    }

    return {
      permissions,
      emission_permissions,
      namespace_permissions,
    };
  };

  // Handle wallet switching - reset selection when account changes
  useEffect(() => {
    if (selectedAccount?.address) {
      // Clear current selection when wallet changes
      if (props.selectedPermissionId && userPermissions) {
        // Check if current selection is valid for new account
        const isCurrentSelectionValid = userPermissions.some(
          (item) => item.permissionId === props.selectedPermissionId,
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
      const transformedData = transformToPermissionWithDetails(
        selectedPermissionData ?? null,
      );
      props.onPermissionDataChange(transformedData);
    }
  }, [selectedPermissionData, props.onPermissionDataChange, props]);

  function getPlaceholderText() {
    if (!isAccountConnected) return "Connect wallet to view permissions";
    if (isLoadingGrantor || isLoadingGrantee || isLoadingAll)
      return "Loading permissions...";
    if (permissionsError) return "Error loading permissions";
    if (!hasPermissions) return "No permissions available";
    return "Select permission";
  }

  function getDetailRows() {
    if (!selectedPermissionData) return [];

    const { contract } = selectedPermissionData;
    const permissionType = getPermissionType(contract);

    // Format duration
    const durationValue = (() => {
      const durationType = Object.keys(contract.duration)[0];
      if (durationType === "Indefinite") return "Indefinite";
      if (durationType === "UntilBlock" && "UntilBlock" in contract.duration) {
        const blockNumber = contract.duration.UntilBlock;
        return `Until Block ${blockNumber.toString()}`;
      }
      return "Unknown";
    })();

    // Format revocation
    const revocationValue = (() => {
      const revocationType = Object.keys(contract.revocation)[0];
      if (revocationType === "Irrevocable") return "Irrevocable";
      if (revocationType === "RevocableByGrantor")
        return "Revocable by Delegator";
      if (
        revocationType === "RevocableAfter" &&
        "RevocableAfter" in contract.revocation
      ) {
        const blockNumber = contract.revocation.RevocableAfter;
        return `Revocable after Block ${blockNumber.toString()}`;
      }
      if (
        revocationType === "RevocableByArbiters" &&
        "RevocableByArbiters" in contract.revocation
      ) {
        const arbiters = contract.revocation.RevocableByArbiters;
        return `Revocable by ${arbiters.requiredVotes.toString()} of ${arbiters.accounts.length} Arbiters`;
      }
      return "Unknown";
    })();

    const detailRows = [
      {
        label: "Permission ID",
        value: smallAddress(selectedPermissionData.permissionId),
      },
      {
        label: "Type",
        value: permissionType,
      },
      {
        label: "Delegator",
        value: smallAddress(contract.grantor),
      },
      {
        label: "Recipient",
        value: smallAddress(contract.grantee),
      },
      {
        label: "Duration",
        value: durationValue,
      },
      {
        label: "Revocation",
        value: revocationValue,
      },
      {
        label: "Created At",
        value: `Block ${contract.createdAt.toString()}`,
      },
    ];

    // Only add execution count for non-namespace permissions
    if (permissionType !== "Capability") {
      detailRows.push({
        label: "Execution Count",
        value: contract.executionCount.toString(),
      });
    }

    // Add namespace paths if it's a namespace permission
    if (
      selectedPermissionData.namespacePaths &&
      selectedPermissionData.namespacePaths.length > 0
    ) {
      detailRows.push({
        label: "Namespace Path",
        value: selectedPermissionData.namespacePaths.join("."),
      });
    }

    return detailRows;
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
                    (item) => item.permissionId === value,
                  );
                  if (props.onPermissionDataChange) {
                    const transformedData = transformToPermissionWithDetails(
                      newPermissionData ?? null,
                    );
                    props.onPermissionDataChange(transformedData);
                  }
                }}
                disabled={
                  !isAccountConnected ||
                  !hasPermissions ||
                  isLoadingGrantor ||
                  isLoadingGrantee ||
                  isLoadingAll
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={getPlaceholderText()} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(() => {
                    if (!userPermissions) return null;

                    // Separate permissions by role and deduplicate
                    const delegatorPermissions = userPermissions.filter(
                      (item) =>
                        item.contract.grantor ===
                        (selectedAccount?.address as SS58Address),
                    );

                    // Filter out permissions where user is also delegator to avoid duplicates
                    const recipientOnlyPermissions = userPermissions.filter(
                      (item) =>
                        item.contract.grantee ===
                          (selectedAccount?.address as SS58Address) &&
                        item.contract.grantor !==
                          (selectedAccount?.address as SS58Address),
                    );

                    return (
                      <>
                        {recipientOnlyPermissions.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>As Recipient</SelectLabel>
                            {recipientOnlyPermissions.map((item) => {
                              const { permissionId, contract } = item;
                              const permissionType =
                                getPermissionType(contract);
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
                        {delegatorPermissions.length > 0 && (
                          <SelectGroup>
                            {delegatorPermissions.map((item) => {
                              const { permissionId, contract } = item;
                              const permissionType =
                                getPermissionType(contract);

                              return (
                                <SelectItem
                                  key={permissionId}
                                  value={permissionId}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{smallAddress(permissionId, 6)}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {permissionType}
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
              <div key={row.label} className="flex">
                <span className="font-medium flex-shrink-0">{row.label}:</span>
                <span className="ml-2 text-muted-foreground break-all">
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
