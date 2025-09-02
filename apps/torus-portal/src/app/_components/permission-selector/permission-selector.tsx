"use client";

import type { PermissionContract } from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { useAllPermissions } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@torus-ts/ui/components/form";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { api as trpcApi } from "~/trpc/react";
import {
  Check,
  ChevronDown,
  CircleArrowOutUpRight,
  Copy,
  VenetianMask,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Control } from "react-hook-form";
import { getContractDetails } from "./contract-details";
import { hasUserRole } from "./permission-filters";

interface PermissionSelectorV2Props {
  control: Control<{
    permissionId: string;
  }>;
  selectedPermissionId: string;
  onPermissionSelection: (
    permissionId: string,
    contract: PermissionContract,
  ) => void;
}

export function PermissionSelectorV2(props: PermissionSelectorV2Props) {
  // State to manage the open/closed status of the command dialog
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const isMobile = useIsMobile();
  const { api, selectedAccount } = useTorus();
  const { data: permissions } = useAllPermissions(api);

  // Collect ALL unique addresses from ALL permissions (not filtered by user role)
  // This way we have agent names cached when user switches wallets
  const allAddresses = new Set<string>();
  if (permissions) {
    [
      ...permissions.streamPermissions,
      ...permissions.namespacePermissions,
      ...permissions.curatorPermissions,
    ].forEach(([_, contract]) => {
      allAddresses.add(contract.delegator);

      if ("Stream" in contract.scope) {
        const recipients = contract.scope.Stream.recipients;
        if (recipients instanceof Map) {
          recipients.forEach((_, address) => allAddresses.add(address));
        } else {
          Object.keys(recipients).forEach((address) =>
            allAddresses.add(address),
          );
        }
        contract.scope.Stream.recipientManagers.forEach((address) =>
          allAddresses.add(address),
        );
        contract.scope.Stream.weightSetters.forEach((address) =>
          allAddresses.add(address),
        );
      } else if ("Namespace" in contract.scope) {
        allAddresses.add(contract.scope.Namespace.recipient);
      } else if ("Curator" in contract.scope) {
        allAddresses.add(contract.scope.Curator.recipient);
      }
    });
  }

  // Fetch agent names for all addresses in a single batch query
  // Always call this hook, but conditionally enable it
  const { data: agentNamesMap } = trpcApi.agent.namesByKeysLastBlock.useQuery(
    { keys: Array.from(allAddresses) },
    { enabled: allAddresses.size > 0 && !!permissions },
  );

  if (!selectedAccount?.address) {
    return <div>Please connect your wallet</div>;
  }
  if (permissions === null || permissions === undefined) {
    return <div>Loading permissions...</div>;
  }

  const userAddress = selectedAccount.address as SS58Address;

  // Helper function to get formatted address with agent name
  const getFormattedAddress = (address: string | undefined) => {
    if (!address) return "Unknown Address";

    const agentName = agentNamesMap?.get(address);
    if (agentName) {
      return `${agentName} (${smallAddress(address, 8)})`;
    }
    return smallAddress(address, 8);
  };

  // Process and filter permissions with headings and details
  const permissionGroups = [
    {
      type: "Stream",
      icon: Zap,
      heading: "Stream Permissions",
      permissions: [...permissions.streamPermissions]
        .filter(([_, contract]) => hasUserRole(contract, userAddress))
        .map(([id, contract]) => ({
          id,
          contract,
          details: getContractDetails(contract, getFormattedAddress),
        })),
    },
    {
      type: "Capability",
      icon: CircleArrowOutUpRight,
      heading: "Capability Permissions",
      permissions: [...permissions.namespacePermissions]
        .filter(([_, contract]) => hasUserRole(contract, userAddress))
        .map(([id, contract]) => ({
          id,
          contract,
          details: getContractDetails(contract, getFormattedAddress),
        })),
    },
    {
      type: "Curator",
      icon: VenetianMask,
      heading: "Curator Permissions",
      permissions: [...permissions.curatorPermissions]
        .filter(([_, contract]) => hasUserRole(contract, userAddress))
        .map(([id, contract]) => ({
          id,
          contract,
          details: getContractDetails(contract, getFormattedAddress),
        })),
    },
  ];

  function getSelectedPermissionDisplay() {
    if (!props.selectedPermissionId) {
      if (!selectedAccount?.address)
        return "Connect wallet to view permissions";
      if (!permissions) return "Loading permissions...";
      return "Search permissions...";
    }
    return isMobile
      ? smallAddress(props.selectedPermissionId)
      : props.selectedPermissionId;
  }

  return (
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
                  disabled={!selectedAccount.address || !permissions}
                  onClick={() => setOpen(true)}
                >
                  {getSelectedPermissionDisplay()}
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
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              {permissionGroups.map((group) => (
                <CommandGroup key={group.type} heading={group.heading}>
                  {group.permissions.map((permission) => {
                    const isSelected =
                      props.selectedPermissionId === permission.id;

                    return (
                      <CommandItem
                        key={permission.id}
                        value={`${permission.id} ${permission.contract.delegator}  ${permission.details.details.join(" ")}`}
                        className="flex max-w-full items-start gap-2 py-2"
                        onSelect={() => {
                          field.onChange(permission.id);
                          props.onPermissionSelection(
                            permission.id,
                            permission.contract,
                          );
                          setOpen(false);
                        }}
                      >
                        <group.icon className="mt-0.5 h-3 w-3 shrink-0" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <span className="truncate font-mono text-sm">
                              {smallAddress(permission.id, 8)}
                            </span>
                            {isSelected && (
                              <Check className="h-4 w-4 shrink-0" />
                            )}
                          </div>

                          <div className="text-muted-foreground w-full space-y-1 text-xs">
                            {permission.details.details.map((detail, idx) => (
                              <div key={idx} className="truncate">
                                {detail}
                              </div>
                            ))}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </CommandList>
          </CommandDialog>
        </>
      )}
    />
  );
}
