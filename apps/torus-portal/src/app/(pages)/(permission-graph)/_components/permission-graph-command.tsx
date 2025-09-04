"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@torus-ts/ui/components/command";
import { DialogTitle } from "@torus-ts/ui/components/dialog";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { api as trpcApi } from "~/trpc/react";
import { Check, Package, Radio, Search, Users, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useMemo, useState } from "react";
import { useGraphData } from "./force-graph/use-graph-data";

export function PermissionGraphCommand() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { graphData } = useGraphData();

  // Detect current route and parameters
  const is2DView =
    typeof window !== "undefined" &&
    window.location.pathname.includes("2d-hypergraph");
  const selectedId = searchParams.get(is2DView ? "agent" : "id");

  const handleSelect = useCallback(
    (nodeId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const paramName = is2DView ? "agent" : "id";
      params.set(paramName, nodeId);

      const basePath = is2DView ? "/2d-hypergraph" : "/";
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
      setOpen(false);
    },
    [router, searchParams, is2DView],
  );

  const allAddresses = useMemo(() => {
    if (!graphData) return new Set<string>();

    const addresses = new Set<string>();

    graphData.agents.forEach((agent) => {
      addresses.add(agent.accountId);
    });

    graphData.permissions.emission.forEach((permission) => {
      addresses.add(permission.delegatorAccountId);
      if (permission.recipientAccountId) {
        addresses.add(permission.recipientAccountId);
      }
      permission.distributionTargets?.forEach((target) => {
        addresses.add(target.targetAccountId);
      });
    });

    graphData.permissions.namespace.forEach((permission) => {
      addresses.add(permission.delegatorAccountId);
      addresses.add(permission.recipientAccountId);
    });

    graphData.signals.forEach((signal) => {
      addresses.add(signal.agentKey);
    });

    return addresses;
  }, [graphData]);

  const { data: agentNamesMap } = trpcApi.agent.namesByKeysLastBlock.useQuery(
    { keys: Array.from(allAddresses) },
    { enabled: allAddresses.size > 0 && !!graphData },
  );

  const getFormattedAddress = useCallback(
    (address: string | undefined, length = 8) => {
      if (!address) return "Unknown";
      const agentName = agentNamesMap?.get(address);
      if (agentName) {
        return `${agentName} (${smallAddress(address, length)})`;
      }
      return smallAddress(address, length);
    },
    [agentNamesMap],
  );

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const searchGroups = useMemo(() => {
    if (!graphData) return [];

    return [
      {
        type: "agent",
        icon: Users,
        heading: "Agents",
        items: Array.from(
          new Map(
            graphData.agents.map((agent) => [
              agent.accountId,
              {
                id: agent.accountId,
                displayName: agent.name || smallAddress(agent.accountId),
                subtitle: `${agent.role} • ${smallAddress(agent.accountId)}`,
                searchText:
                  `${agent.accountId} ${agent.name} ${agent.role}`.toLowerCase(),
              },
            ]),
          ).values(),
        ),
      },
      {
        type: "stream",
        icon: Zap,
        heading: "Stream Permissions",
        items: Array.from(
          new Map(
            graphData.permissions.emission.map((permission) => [
              permission.id,
              {
                id: `permission-${permission.id}`,
                displayName: "Stream Permission",
                subtitle: `From: ${getFormattedAddress(permission.delegatorAccountId, 4)} → To: ${
                  permission.distributionTargets?.length
                    ? `${permission.distributionTargets.length} recipients`
                    : getFormattedAddress(permission.recipientAccountId, 4)
                }`,
                searchText:
                  `${permission.id} ${permission.delegatorAccountId} stream emission`.toLowerCase(),
              },
            ]),
          ).values(),
        ),
      },
      {
        type: "namespace",
        icon: Package,
        heading: "Capability Permissions",
        items: Array.from(
          new Map(
            graphData.permissions.namespace.map((permission) => [
              permission.id,
              {
                id: `permission-${permission.id}`,
                displayName: "Capability Permission",
                subtitle: `From: ${getFormattedAddress(permission.delegatorAccountId, 4)} → To: ${getFormattedAddress(permission.recipientAccountId, 4)}`,
                searchText:
                  `${permission.id} ${permission.delegatorAccountId} ${permission.recipientAccountId} namespace capability`.toLowerCase(),
              },
            ]),
          ).values(),
        ),
      },
      {
        type: "signal",
        icon: Radio,
        heading: "Signals",
        items: Array.from(
          new Map(
            graphData.signals.map((signal) => [
              signal.id,
              {
                id: `signal-${signal.id}`,
                displayName: signal.title,
                subtitle: `From: ${getFormattedAddress(signal.agentKey, 4)}`,
                searchText:
                  `${signal.title} ${signal.description} ${signal.agentKey} signal`.toLowerCase(),
              },
            ]),
          ).values(),
        ),
      },
    ];
  }, [graphData, getFormattedAddress]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "j" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  if (!graphData) {
    return (
      <button
        className="bg-background flex w-full items-center justify-between gap-6 rounded border p-2.5 text-sm md:w-fit"
        disabled
      >
        <span className="text-muted-foreground flex items-center gap-2">
          <Search className="text-muted-foreground h-4 w-4" />
          Loading...
        </span>
      </button>
    );
  }

  const title = isMobile
    ? "Search..."
    : "Search agents, permissions or signals...";

  return (
    <>
      <button
        className="bg-background flex w-full items-center justify-between gap-6 rounded border p-2.5 text-sm md:w-fit"
        onClick={() => setOpen(true)}
      >
        <span className="text-muted-foreground flex min-w-0 flex-1 items-center gap-2 truncate">
          <Search className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          <span className="truncate">{title}</span>
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>J
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="hidden">{title}</DialogTitle>
        <CommandInput placeholder={title} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {searchGroups.map(
            (group) =>
              group.items.length > 0 && (
                <CommandGroup key={group.type} heading={group.heading}>
                  {group.items.map((item) => {
                    const isSelected = selectedId === item.id;
                    return (
                      <CommandItem
                        key={item.id}
                        value={`${item.searchText} ${item.displayName} ${item.subtitle}`}
                        className="flex max-w-full items-start gap-2 py-2"
                        onSelect={() => handleSelect(item.id)}
                      >
                        <group.icon className="mt-0.5 h-3 w-3 shrink-0" />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center justify-between">
                            <span className="truncate text-sm">
                              {item.displayName}
                            </span>
                            {isSelected && (
                              <Check className="ml-2 h-4 w-4 shrink-0" />
                            )}
                          </div>
                          <div className="text-muted-foreground truncate text-xs">
                            {item.subtitle}
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ),
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
