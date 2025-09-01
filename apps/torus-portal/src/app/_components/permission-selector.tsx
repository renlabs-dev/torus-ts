/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import { useQuery } from "@tanstack/react-query";
import type { PermissionContract } from "@torus-network/sdk/chain";
import {
  queryPermissions,
  queryPermissionsByDelegator,
  queryPermissionsByRecipient,
} from "@torus-network/sdk/chain";
import { CONSTANTS } from "@torus-network/sdk/constants";
import type { SS58Address } from "@torus-network/sdk/types";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { DialogTitle } from "@torus-ts/ui/components/dialog";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import {
  formatCapabilityPath,
  getCapabilityPaths,
  ShortenedCapabilityPath,
} from "~/utils/capability-path";
import { Check, ChevronDown, Copy, Package, Zap } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Control } from "react-hook-form";
import type { PermissionWithDetails } from "../(pages)/permissions/manage-permission/_components/edit-permission-form";
// Import the expected interface from the form
import { AddressWithAgent } from "./address-with-agent";

interface PermissionWithNetworkData {
  permissionId: string;
  contract: PermissionContract;
  namespacePaths?: string[];
  delegatorAgentName?: string;
  recipientAgentName?: string;
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
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Get user's permission IDs (both delegator and recipient)
  const { data: userPermissionIds, isLoading: isLoadingUserPermissions } =
    useQuery({
      queryKey: ["user_permissions", selectedAccount?.address],
      queryFn: async () => {
        if (!api || !selectedAccount?.address) return null;

        const [delegatorResult, recipientResult] = await Promise.all([
          queryPermissionsByDelegator(
            api,
            selectedAccount.address as SS58Address,
          ),
          queryPermissionsByRecipient(
            api,
            selectedAccount.address as SS58Address,
          ),
        ]);

        const permissionIds = new Set<string>();
        const [, delegatorData] = delegatorResult;
        const [, recipientData] = recipientResult;

        if (delegatorData) delegatorData.forEach((id) => permissionIds.add(id));
        if (recipientData) recipientData.forEach((id) => permissionIds.add(id));

        return {
          all: Array.from(permissionIds),
          delegator: delegatorData ?? [],
          recipient: recipientData ?? [],
        };
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
    if (!allPermissions || permissionsError || !userPermissionIds) return null;

    const filtered: PermissionWithNetworkData[] = [];

    if (allPermissions instanceof Map) {
      userPermissionIds.all.forEach((permissionId) => {
        const contract = allPermissions.get(permissionId as `0x${string}`);
        if (contract) {
          let namespacePaths: string[] | undefined;
          if ("Namespace" in contract.scope) {
            namespacePaths = contract.scope.Namespace
              .paths as unknown as string[];
          }
          filtered.push({ permissionId, contract, namespacePaths });
        }
      });
    }

    return filtered;
  }, [allPermissions, permissionsError, userPermissionIds]);

  // Helper function to get recipient from contract scope
  const getRecipientFromContract = useCallback(
    (contract: PermissionContract): string | null => {
      const scopeType = Object.keys(contract.scope)[0];
      if (scopeType === "Namespace" && "Namespace" in contract.scope) {
        return contract.scope.Namespace.recipient;
      }
      if (scopeType === "Stream" && "Stream" in contract.scope) {
        // For stream permissions, get the first recipient (since they can have multiple)
        const recipients = contract.scope.Stream.recipients;
        if (recipients instanceof Map && recipients.size > 0) {
          return Array.from(recipients.keys())[0] || null;
        }
        // If recipients is an object (parsed from JSON)
        if (typeof recipients === "object") {
          const keys = Object.keys(recipients);
          return keys.length > 0 ? (keys[0] ?? null) : null;
        }
        return null;
      }
      if (scopeType === "Curator" && "Curator" in contract.scope) {
        return contract.scope.Curator.recipient;
      }
      return null;
    },
    [],
  );

  // For now, we'll show agent names in the detailed view with AddressWithAgent component
  // Agent names in the dropdown items can be added later when we have proper batch fetching
  const agentNameMap = useMemo(() => {
    return new Map<string, string>();
  }, []);

  // Enhanced user permissions with agent names
  const userPermissionsWithNames = useMemo(() => {
    if (!userPermissions) return null;
    return userPermissions.map((permission) => ({
      ...permission,
      delegatorAgentName: agentNameMap.get(permission.contract.delegator),
      recipientAgentName: agentNameMap.get(
        getRecipientFromContract(permission.contract) || "",
      ),
    }));
  }, [userPermissions, agentNameMap, getRecipientFromContract]);

  const hasPermissions =
    userPermissionsWithNames && userPermissionsWithNames.length > 0;

  // Helper function to determine permission type
  const getPermissionType = (contract: PermissionContract | null) => {
    if (!contract) return "Unknown";
    const scopeType = Object.keys(contract.scope)[0];
    if (scopeType === "Stream") return "Stream"; // Updated to match SDK terminology
    if (scopeType === "Namespace") return "Capability";
    if (scopeType === "Curator") return "Curator";
    return "Unknown";
  };

  // Helper to render capability paths in CommandItems
  const renderCapabilityPaths = (namespacePaths: unknown) => {
    if (!namespacePaths) return null;
    const { paths } = getCapabilityPaths(namespacePaths);
    return (
      <div className="space-y-0.5">
        {paths.map((path, index) => (
          <div key={index} className="truncate" title={path}>
            Capability{paths.length > 1 ? ` ${index + 1}` : ""}:{" "}
            <ShortenedCapabilityPath path={path} showTooltip={false} />
          </div>
        ))}
      </div>
    );
  };

  // Mobile-responsive class helpers
  const getDetailRowClassName = () =>
    isMobile ? "flex flex-col space-y-1" : "flex items-center";
  const getDetailValueClassName = () =>
    isMobile
      ? "text-muted-foreground break-all"
      : "ml-2 text-muted-foreground break-all";

  // Enhanced search data with agent names and grouping
  const searchData = useMemo(() => {
    if (!userPermissionsWithNames)
      return { emissionPermissions: [], namespacePermissions: [] };

    const emissionPermissions = userPermissionsWithNames
      .filter((item) => getPermissionType(item.contract) === "Stream")
      .map((item) => ({
        ...item,
        searchText: [
          item.permissionId,
          getCapabilityPaths(item.namespacePaths).pathString,
          "emission",
          item.contract.delegator,
          // TODO: Add search support for all recipients in multi-recipient stream permissions
          getRecipientFromContract(item.contract),
          item.delegatorAgentName,
          item.recipientAgentName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      }));

    const namespacePermissions = userPermissionsWithNames
      .filter((item) => getPermissionType(item.contract) === "Capability")
      .map((item) => ({
        ...item,
        searchText: [
          item.permissionId,
          getCapabilityPaths(item.namespacePaths).pathString,
          "capability",
          item.contract.delegator,
          // TODO: Add search support for all recipients in multi-recipient stream permissions
          getRecipientFromContract(item.contract),
          item.delegatorAgentName,
          item.recipientAgentName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      }));

    return { emissionPermissions, namespacePermissions };
  }, [userPermissionsWithNames, getRecipientFromContract]);

  // Prioritize delegator permissions for auto-selection
  const getDefaultPermissionId = () => {
    if (!userPermissionsWithNames?.length || !userPermissionIds) return null;

    // First try delegator permissions, then recipient permissions
    const priorityOrder: string[] = [
      ...userPermissionIds.delegator,
      ...userPermissionIds.recipient,
    ];
    const firstMatch = userPermissionsWithNames.find((p) =>
      priorityOrder.includes(p.permissionId),
    );

    return firstMatch?.permissionId ?? null;
  };

  const defaultPermissionId = getDefaultPermissionId();

  const selectedPermissionData = userPermissionsWithNames?.find(
    (item) => item.permissionId === props.selectedPermissionId,
  );

  // Transform network data to match expected format
  const transformToPermissionWithDetails = useCallback(
    (
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
        grantorAccountId: contract.delegator,
        granteeAccountId: getRecipientFromContract(contract) || "",
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
          if (revType === "RevocableByDelegator")
            return "revocable_by_delegator";
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
      if (scopeType === "Stream" && "Stream" in contract.scope) {
        const streamScope = contract.scope.Stream;
        const allocationType = Object.keys(streamScope.allocation)[0];
        const distributionType = Object.keys(streamScope.distribution)[0];

        emission_permissions = {
          permissionId,
          allocationType:
            allocationType === "Streams"
              ? ("streams" as const)
              : ("fixed_amount" as const),
          fixedAmount:
            "FixedAmount" in streamScope.allocation
              ? streamScope.allocation.FixedAmount.toString()
              : null,
          distributionType: distributionType
            ? (distributionType
                .toLowerCase()
                .replace(/([A-Z])/g, "_$1")
                .toLowerCase()
                .slice(1) as "manual" | "at_block" | "automatic" | "interval")
            : "manual",
          distributionThreshold:
            "Automatic" in streamScope.distribution
              ? streamScope.distribution.Automatic.toString()
              : null,
          distributionTargetBlock:
            "AtBlock" in streamScope.distribution
              ? BigInt(streamScope.distribution.AtBlock)
              : null,
          distributionIntervalBlocks:
            "Interval" in streamScope.distribution
              ? BigInt(streamScope.distribution.Interval)
              : null,
          accumulating: streamScope.accumulating,
          weightSetter: streamScope.weightSetters,
          recipientManager: streamScope.recipientManagers,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
      }

      // Build capability permissions if applicable
      let namespace_permissions: PermissionWithDetails["namespace_permissions"] =
        null;
      if (scopeType === "Namespace" && "Namespace" in contract.scope) {
        namespace_permissions = {
          permissionId,
          recipient: contract.scope.Namespace.recipient,
          maxInstances: contract.scope.Namespace.maxInstances,
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
    },
    [getRecipientFromContract],
  );

  function getPlaceholderText() {
    if (!isAccountConnected) return "Connect wallet to view permissions";
    if (isLoadingUserPermissions || isLoadingAll)
      return "Loading permissions...";
    if (permissionsError) return "Error loading permissions";
    if (!hasPermissions) return "No permissions available";
    return "Search permissions...";
  }

  function getSelectedPermissionDisplay() {
    if (!props.selectedPermissionId || !selectedPermissionData) {
      return getPlaceholderText();
    }

    const { permissionId, contract, namespacePaths } = selectedPermissionData;

    // On mobile, show only the permission ID
    if (isMobile) {
      return smallAddress(permissionId, 4);
    }

    const permissionType = getPermissionType(contract);
    const displayId = smallAddress(permissionId, 6);
    const { pathString: capabilityPath } = getCapabilityPaths(namespacePaths);

    let displayName = `${displayId} (${permissionType})`;
    if (capabilityPath && permissionType === "Capability") {
      const formattedPath = formatCapabilityPath(capabilityPath);
      displayName += ` - ${formattedPath}`;
    }

    return displayName;
  }

  // Handle wallet switching - reset selection when account changes
  useEffect(() => {
    if (selectedAccount?.address) {
      // Clear current selection when wallet changes
      if (props.selectedPermissionId && userPermissionsWithNames) {
        // Check if current selection is valid for new account
        const isCurrentSelectionValid = userPermissionsWithNames.some(
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
    userPermissionsWithNames,
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
  }, [
    selectedPermissionData,
    props.onPermissionDataChange,
    props,
    transformToPermissionWithDetails,
  ]);

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
      if (revocationType === "RevocableByDelegator")
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
        component: (
          <div className="flex items-center gap-2">
            <CopyButton
              copy={selectedPermissionData.permissionId}
              variant="ghost"
              message="Permission ID copied to clipboard"
              className="hover:bg-muted/50 h-auto p-1"
            >
              <Copy className="h-3 w-3" />
            </CopyButton>
            <span className="font-mono text-sm">
              {smallAddress(selectedPermissionData.permissionId, 8)}
            </span>
          </div>
        ),
      },
      {
        label: "Delegator",
        component: (
          <AddressWithAgent
            address={contract.delegator}
            showCopyButton={true}
            addressLength={8}
            className="text-sm"
          />
        ),
      },
      // Only show Recipient for non-stream permissions
      ...(permissionType !== "Stream"
        ? [
            {
              label: "Recipient",
              component: (
                <AddressWithAgent
                  address={getRecipientFromContract(contract) || ""}
                  showCopyButton={true}
                  addressLength={8}
                  className="text-sm"
                />
              ),
            },
          ]
        : []),
      {
        label: "Type",
        value: permissionType,
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

    // Only add execution count for non-capability permissions
    if (permissionType !== "Capability") {
      detailRows.push({
        label: "Execution Count",
        value: contract.executionCount.toString(),
      });
    }

    // Add capability paths if it's a capability permission
    const { paths: capabilityPaths } = getCapabilityPaths(
      selectedPermissionData.namespacePaths,
    );
    if (capabilityPaths.length > 0) {
      if (capabilityPaths.length === 1) {
        detailRows.push({
          label: "Capability Path",
          component: (
            <ShortenedCapabilityPath
              path={capabilityPaths[0]!}
              showTooltip={true}
              className="font-mono text-sm"
            />
          ),
        });
      } else {
        detailRows.push({
          label: "Capability Paths",
          component: (
            <div className="space-y-1">
              {capabilityPaths.map((path, index) => (
                <div key={index} className="text-sm">
                  {index + 1}.{" "}
                  <ShortenedCapabilityPath
                    path={path}
                    showTooltip={true}
                    className="font-mono"
                  />
                </div>
              ))}
            </div>
          ),
        });
      }
    }

    return detailRows;
  }

  return (
    <div className="space-y-2">
      <FormField
        control={props.control}
        name="permissionId"
        render={({ field }) => (
          <>
            <FormItem>
              <FormLabel>Select Permission</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full min-w-0 justify-between"
                    disabled={
                      !isAccountConnected ||
                      !hasPermissions ||
                      isLoadingUserPermissions ||
                      isLoadingAll
                    }
                    onClick={() => setOpen(true)}
                  >
                    <span
                      className="min-w-0 flex-1 truncate text-left"
                      title={getSelectedPermissionDisplay()}
                    >
                      {getSelectedPermissionDisplay()}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
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

            <CommandDialog open={open} onOpenChange={setOpen}>
              <DialogTitle className="hidden">
                Search permissions...
              </DialogTitle>
              <CommandInput placeholder="Search permissions..." />
              <CommandList>
                <CommandEmpty>No permissions found.</CommandEmpty>

                {searchData.emissionPermissions.length > 0 && (
                  <CommandGroup heading="Stream Permissions">
                    {searchData.emissionPermissions.map((item) => {
                      const { permissionId } = item;
                      const isSelected =
                        props.selectedPermissionId === permissionId;

                      return (
                        <CommandItem
                          key={permissionId}
                          value={item.searchText}
                          onSelect={() => {
                            field.onChange(permissionId);
                            props.onPermissionIdChange(permissionId);
                            if (props.onPermissionDataChange) {
                              const transformedData =
                                transformToPermissionWithDetails(item);
                              props.onPermissionDataChange(transformedData);
                            }
                            setOpen(false);
                          }}
                          className="flex max-w-full items-start gap-2 py-2"
                        >
                          <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-mono text-sm">
                                {smallAddress(permissionId, 8)}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 shrink-0" />
                              )}
                            </div>
                            <div className="text-muted-foreground space-y-0.5 text-xs">
                              {item.namespacePaths &&
                                renderCapabilityPaths(item.namespacePaths)}
                              <div className="text-muted-foreground truncate">
                                <span className="text-xs">
                                  ID: {smallAddress(permissionId, 6)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}

                {searchData.namespacePermissions.length > 0 && (
                  <CommandGroup heading="Capability Permissions">
                    {searchData.namespacePermissions.map((item) => {
                      const { permissionId } = item;
                      const isSelected =
                        props.selectedPermissionId === permissionId;

                      return (
                        <CommandItem
                          key={permissionId}
                          value={item.searchText}
                          onSelect={() => {
                            field.onChange(permissionId);
                            props.onPermissionIdChange(permissionId);
                            if (props.onPermissionDataChange) {
                              const transformedData =
                                transformToPermissionWithDetails(item);
                              props.onPermissionDataChange(transformedData);
                            }
                            setOpen(false);
                          }}
                          className="flex max-w-full items-start gap-2 py-2"
                        >
                          <Package className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-mono text-sm">
                                {smallAddress(permissionId, 8)}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 shrink-0" />
                              )}
                            </div>
                            <div className="text-muted-foreground space-y-0.5 text-xs">
                              {item.namespacePaths &&
                                renderCapabilityPaths(item.namespacePaths)}
                              <div className="text-muted-foreground truncate">
                                <span className="text-xs">
                                  ID: {smallAddress(permissionId, 6)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </CommandDialog>
          </>
        )}
      />

      {props.selectedPermissionId && selectedPermissionData && (
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-semibold">
              Permission Details
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 pt-0 text-sm">
            {getDetailRows().map((row) => (
              <div key={row.label} className={getDetailRowClassName()}>
                <span className="flex-shrink-0 font-medium">{row.label}:</span>
                <div className={getDetailValueClassName()}>
                  {row.component ?? row.value}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
