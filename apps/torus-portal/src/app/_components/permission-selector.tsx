/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Copy, Package, Zap } from "lucide-react";
import type { Control } from "react-hook-form";

import type {
  PermissionContract,
  PermissionId,
} from "@torus-network/sdk/chain";
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

// Import the expected interface from the form
import type { PermissionWithDetails } from "../(pages)/permissions/manage-permission/_components/revoke-permission-button";
import { AddressWithAgent } from "./address-with-agent";

// Helper function to safely extract multiple capability paths as array
function getCapabilityPathsArray(namespacePaths: unknown): string[] {
  // Handle arrays - this is the most common case
  if (Array.isArray(namespacePaths)) {
    return namespacePaths.map(String);
  }

  // Handle strings that might have commas - convert them to array
  if (typeof namespacePaths === "string") {
    // If it has commas, split into array
    if (namespacePaths.includes(",")) {
      return namespacePaths.split(",").map((s) => s.trim());
    }
    return [namespacePaths];
  }

  if (namespacePaths && typeof namespacePaths === "object") {
    // Handle Map objects (the actual case we're dealing with)
    if (namespacePaths instanceof Map) {
      try {
        const allPaths: string[] = [];

        // Iterate through Map entries to preserve separate paths
        for (const [, value] of namespacePaths.entries()) {
          if (Array.isArray(value)) {
            // Each value is an array that might contain nested arrays
            for (const item of value) {
              if (Array.isArray(item)) {
                // Handle nested arrays like [['agent', 'gumball']]
                allPaths.push(item.join("."));
              } else if (typeof item === "string") {
                allPaths.push(item);
              } else {
                allPaths.push(String(item));
              }
            }
          } else if (typeof value === "string") {
            allPaths.push(value);
          } else {
            allPaths.push(String(value));
          }
        }

        return allPaths.filter((path) => path && path !== "");
      } catch {
        return [];
      }
    }

    // Handle Map-like objects with values() method
    if (
      "values" in namespacePaths &&
      typeof namespacePaths.values === "function"
    ) {
      try {
        const values = Array.from(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          namespacePaths.values() as Iterable<unknown>,
        );

        const allPaths: string[] = [];
        for (const value of values) {
          if (Array.isArray(value)) {
            allPaths.push(...value.map((v) => String(v)));
          } else if (typeof value === "string") {
            allPaths.push(value);
          } else {
            allPaths.push(String(value));
          }
        }

        return allPaths.filter((path) => path && path !== "");
      } catch {
        return [];
      }
    }

    // Handle array-like objects or regular objects with numeric/string keys
    const keys = Object.keys(namespacePaths);
    if (keys.length > 0) {
      // Sort numeric keys to maintain order
      const sortedKeys = keys.sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return a.localeCompare(b);
      });

      try {
        const paths = sortedKeys
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
          .map((key) => (namespacePaths as any)[key])
          .filter((v) => v != null)
          .map((v) => String(v)); // Ensure string conversion

        return paths.filter((path) => path && path !== "");
      } catch {
        return [];
      }
    }

    return [];
  }

  return [];
}

// Helper function to safely extract capability path string (for backward compatibility)
function getCapabilityPathString(namespacePaths: unknown): string {
  const paths = getCapabilityPathsArray(namespacePaths);
  return paths.join(".");
}

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

  // Get permission IDs where the user is the delegator
  const { data: delegatorPermissionIds, isLoading: isLoadingDelegator } =
    useQuery({
      queryKey: ["permissions_by_delegator", selectedAccount?.address],
      queryFn: async () => {
        if (!api || !selectedAccount?.address) return null;
        const result = await queryPermissionsByDelegator(
          api,
          selectedAccount.address as SS58Address,
        );
        // Unwrap Result type
        const [error, data] = result;
        if (error) {
          console.error("Error querying delegator permissions:", error);
          return null;
        }
        return data;
      },
      enabled: !!api && !!selectedAccount?.address,
      staleTime: CONSTANTS.TIME.STAKE_STALE_TIME,
    });

  // Get permission IDs where the user is the recipient
  const { data: recipientPermissionIds, isLoading: isLoadingRecipient } =
    useQuery({
      queryKey: ["permissions_by_recipient", selectedAccount?.address],
      queryFn: async () => {
        if (!api || !selectedAccount?.address) return null;
        const result = await queryPermissionsByRecipient(
          api,
          selectedAccount.address as SS58Address,
        );
        // Unwrap Result type
        const [error, data] = result;
        if (error) {
          console.error("Error querying recipient permissions:", error);
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

    // Add delegator permission IDs (already unwrapped)
    if (delegatorPermissionIds && Array.isArray(delegatorPermissionIds)) {
      delegatorPermissionIds.forEach((id: PermissionId) =>
        userPermissionIds.add(id),
      );
    }

    // Add recipient permission IDs (already unwrapped)
    if (recipientPermissionIds && Array.isArray(recipientPermissionIds)) {
      recipientPermissionIds.forEach((id: PermissionId) =>
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
          // Extract capability paths if it's a capability permission
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
    delegatorPermissionIds,
    recipientPermissionIds,
    permissionsError,
  ]);

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
      recipientAgentName: agentNameMap.get(permission.contract.recipient),
    }));
  }, [userPermissions, agentNameMap]);

  const hasPermissions =
    userPermissionsWithNames && userPermissionsWithNames.length > 0;

  // Helper function to determine permission type
  const getPermissionType = (contract: PermissionContract | null) => {
    if (!contract) return "Unknown";
    const scopeType = Object.keys(contract.scope)[0];
    if (scopeType === "Emission") return "Emission";
    if (scopeType === "Namespace") return "Capability";
    if (scopeType === "Curator") return "Curator";
    return "Unknown";
  };

  // Helper function to truncate capability namespace paths intelligently
  // Format: agent.agent-name.path.subpath -> agent.agent-name...subpath
  const truncateNamespacePath = (
    path: string,
    maxLength: number = 25,
  ): string => {
    if (path.length <= maxLength) return path;

    const parts = path.split(".");
    if (parts.length <= 2) {
      // If only 1-2 parts, truncate the longest part
      if (parts.length === 1) {
        return parts[0]!.length > maxLength
          ? parts[0]!.substring(0, maxLength - 3) + "..."
          : parts[0]!;
      } else {
        const joined = parts.join(".");
        return joined.length > maxLength
          ? parts[0] +
              "..." +
              parts[1]!.substring(
                Math.max(
                  0,
                  parts[1]!.length - (maxLength - parts[0]!.length - 6),
                ),
              )
          : joined;
      }
    }

    const start = parts.slice(0, 2).join("."); // agent.agent-name
    const end = parts[parts.length - 1]; // subpath
    if (!end) return path; // Fallback if end is undefined

    const truncated = `${start}...${end}`;

    // If the start itself is too long, truncate it
    if (start.length > maxLength - 6) {
      // Reserve space for "...end"
      const firstPart = parts[0]!;
      const secondPart = parts[1]!;
      const availableForSecond = maxLength - firstPart.length - 7; // "agent...end"

      if (availableForSecond > 3) {
        const truncatedSecond =
          secondPart.substring(0, availableForSecond) + "...";
        return `${firstPart}.${truncatedSecond}...${end}`;
      } else {
        // If even the first part is too long, truncate it
        return `${firstPart.substring(0, maxLength - 6)}...${end}`;
      }
    }

    // If truncated is still too long, truncate the end part
    if (truncated.length > maxLength && end.length > 8) {
      const availableForEnd = maxLength - start.length - 6; // "start...end"
      if (availableForEnd > 3) {
        const shortenedEnd = end.substring(0, availableForEnd) + "...";
        return `${start}...${shortenedEnd}`;
      }
    }

    return truncated.length > maxLength
      ? `${start.substring(0, maxLength - 6)}...${end}`
      : truncated;
  };

  // Enhanced search data with agent names and grouping
  const searchData = useMemo(() => {
    if (!userPermissionsWithNames)
      return { emissionPermissions: [], namespacePermissions: [] };

    const emissionPermissions = userPermissionsWithNames
      .filter((item) => getPermissionType(item.contract) === "Emission")
      .map((item) => ({
        ...item,
        searchText: [
          item.permissionId,
          getCapabilityPathString(item.namespacePaths),
          "emission",
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
          getCapabilityPathString(item.namespacePaths),
          "capability",
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      }));

    return { emissionPermissions, namespacePermissions };
  }, [userPermissionsWithNames]);

  // Prioritize delegator permissions for auto-selection
  const getDefaultPermissionId = () => {
    if (!userPermissionsWithNames?.length) return null;

    // First try to find a delegator permission
    const delegatorPermission = userPermissionsWithNames.find(
      (item) =>
        item.contract.delegator === (selectedAccount?.address as SS58Address),
    );

    if (delegatorPermission) {
      return delegatorPermission.permissionId;
    }

    // Fall back to first recipient permission
    const recipientPermission = userPermissionsWithNames.find(
      (item) =>
        item.contract.recipient === (selectedAccount?.address as SS58Address),
    );

    return recipientPermission?.permissionId ?? null;
  };

  const defaultPermissionId = getDefaultPermissionId();

  const selectedPermissionData = userPermissionsWithNames?.find(
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
      grantorAccountId: contract.delegator,
      granteeAccountId: contract.recipient,
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
        if (revType === "RevocableByDelegator") return "revocable_by_delegator";
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

    // Build capability permissions if applicable
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

  function getPlaceholderText() {
    if (!isAccountConnected) return "Connect wallet to view permissions";
    if (isLoadingDelegator || isLoadingRecipient || isLoadingAll)
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
    const displayId = smallAddress(permissionId, 6); // Shorter for main display
    const capabilityPath = getCapabilityPathString(namespacePaths);

    let displayName = `${displayId} (${permissionType})`;
    if (capabilityPath) {
      // For selected value, use more aggressive truncation to prevent overflow
      const truncatedPath =
        permissionType === "Capability"
          ? truncateNamespacePath(capabilityPath, 35) // Shorter for selected display
          : capabilityPath.length > 35
            ? capabilityPath.substring(0, 35) + "..."
            : capabilityPath;
      displayName += ` - ${truncatedPath}`;
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
  }, [selectedPermissionData, props.onPermissionDataChange, props]);

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
              className="h-auto p-1 hover:bg-muted/50"
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
      // Only show Recipient for non-emission permissions
      ...(permissionType !== "Emission"
        ? [
            {
              label: "Recipient",
              component: (
                <AddressWithAgent
                  address={contract.recipient}
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
    const capabilityPaths = getCapabilityPathsArray(
      selectedPermissionData.namespacePaths,
    );
    if (capabilityPaths.length > 0) {
      if (capabilityPaths.length === 1) {
        detailRows.push({
          label: "Capability Path",
          value: capabilityPaths[0]!,
        });
      } else {
        detailRows.push({
          label: "Capability Paths",
          component: (
            <div className="space-y-1">
              {capabilityPaths.map((path, index) => (
                <div key={index} className="text-sm">
                  {index + 1}. {path}
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
                    className="w-full justify-between min-w-0"
                    disabled={
                      !isAccountConnected ||
                      !hasPermissions ||
                      isLoadingDelegator ||
                      isLoadingRecipient ||
                      isLoadingAll
                    }
                    onClick={() => setOpen(true)}
                  >
                    <span
                      className="truncate text-left flex-1 min-w-0"
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
                  <CommandGroup heading="Emission Permissions">
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
                          className="flex items-start gap-2 py-2 max-w-full"
                        >
                          <Zap className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm truncate">
                                {smallAddress(permissionId, 8)}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {item.namespacePaths && (
                                <div
                                  className="space-y-0.5"
                                  title={getCapabilityPathsArray(
                                    item.namespacePaths,
                                  ).join(", ")}
                                >
                                  {getCapabilityPathsArray(
                                    item.namespacePaths,
                                  ).map((path, index) => (
                                    <div key={index} className="truncate">
                                      Capability
                                      {getCapabilityPathsArray(
                                        item.namespacePaths,
                                      ).length > 1
                                        ? ` ${index + 1}`
                                        : ""}
                                      : {path}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="truncate text-muted-foreground">
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
                          className="flex items-start gap-2 py-2 max-w-full"
                        >
                          <Package className="h-4 w-4 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm truncate">
                                {smallAddress(permissionId, 8)}
                              </span>
                              {isSelected && (
                                <Check className="h-4 w-4 shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              {item.namespacePaths && (
                                <div
                                  className="space-y-0.5"
                                  title={getCapabilityPathsArray(
                                    item.namespacePaths,
                                  ).join(", ")}
                                >
                                  {getCapabilityPathsArray(
                                    item.namespacePaths,
                                  ).map((path, index) => (
                                    <div key={index} className="truncate">
                                      Capability
                                      {getCapabilityPathsArray(
                                        item.namespacePaths,
                                      ).length > 1
                                        ? ` ${index + 1}`
                                        : ""}
                                      : {path}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="truncate text-muted-foreground">
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

          <CardContent className="text-sm p-4 pt-0">
            {getDetailRows().map((row) => (
              <div
                key={row.label}
                className={
                  isMobile ? "flex flex-col space-y-1" : "flex items-center"
                }
              >
                <span className="font-medium flex-shrink-0">{row.label}:</span>
                <div
                  className={
                    isMobile
                      ? "text-muted-foreground break-all"
                      : "ml-2 text-muted-foreground break-all"
                  }
                >
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
