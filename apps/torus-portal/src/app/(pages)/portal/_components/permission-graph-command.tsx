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
import { useDebounce } from "@torus-ts/ui/hooks/use-debounce";
import { useIsMobile } from "@torus-ts/ui/hooks/use-mobile";
import { api as trpcApi } from "~/trpc/react";
import { Check, Package, Radio, Search, Users, Zap } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useGraphData } from "./force-graph/use-graph-data";

interface GraphAgent {
  accountId: string;
  name: string;
  role: "Allocator" | "Root Agent" | "Target Agent";
  isWhitelisted?: boolean;
  isAllocated?: boolean;
}

interface SearchItem {
  id: string;
  displayName: string;
  subtitle: string;
  searchText: string;
}

interface SearchGroup {
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  items: SearchItem[];
}

interface SearchGroupsProps {
  groups: SearchGroup[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SearchGroups({ groups, selectedId, onSelect }: SearchGroupsProps) {
  return (
    <>
      {groups.map(
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
                    onSelect={() => onSelect(item.id)}
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
    </>
  );
}

export function PermissionGraphCommand() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const query = useDebounce<string>(inputValue, 500);
  const isMobile = useIsMobile();
  const { graphData } = useGraphData();
  const commandListRef = useRef<HTMLDivElement>(null);

  // Detect current route and parameters using stable pathname
  const is2DView = pathname.includes("2d-hypergraph");
  const selectedId = searchParams.get(is2DView ? "agent" : "id");

  // Reset scroll to top when query changes
  useEffect(() => {
    if (commandListRef.current) {
      commandListRef.current.scrollTop = 0;
    }
  }, [query]);

  const handleSelect = useCallback(
    (nodeId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const paramName = is2DView ? "agent" : "id";
      params.set(paramName, nodeId);

      const basePath = is2DView ? "/portal/2d-hypergraph" : "/portal";
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
      setOpen(false);
    },
    [router, searchParams, is2DView],
  );

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setInputValue("");
    }
  }, []);

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
      const agentName = agentNamesMap?.[address];
      return agentName
        ? `${agentName} (${smallAddress(address, length)})`
        : smallAddress(address, length);
    },
    [agentNamesMap],
  );

  // Pre-compute agent lookup maps for O(1) search
  const agentMaps = useMemo(() => {
    if (!graphData)
      return {
        byId: new Map<string, GraphAgent>(),
        byName: new Map<string, GraphAgent>(),
      };

    const byId = new Map<string, GraphAgent>();
    const byName = new Map<string, GraphAgent>();

    graphData.agents.forEach((agent) => {
      byId.set(agent.accountId.toLowerCase(), agent);
      if (agent.name) {
        byName.set(agent.name.toLowerCase(), agent);
      }
    });

    return { byId, byName };
  }, [graphData]);

  // Pre-compute agent relationships for O(1) lookup
  const agentRelationships = useMemo(() => {
    if (!graphData) return new Map<string, Set<string>>();

    const relationships = new Map<string, Set<string>>();

    graphData.agents.forEach((agent) => {
      const related = new Set<string>();

      // Add emission permissions
      graphData.permissions.emission.forEach((p) => {
        if (
          p.delegatorAccountId === agent.accountId ||
          p.recipientAccountId === agent.accountId ||
          p.distributionTargets?.some(
            (target) => target.targetAccountId === agent.accountId,
          )
        ) {
          related.add(`permission-${p.id}`);
        }
      });

      // Add namespace permissions
      graphData.permissions.namespace.forEach((p) => {
        if (
          p.delegatorAccountId === agent.accountId ||
          p.recipientAccountId === agent.accountId
        ) {
          related.add(`permission-${p.id}`);
        }
      });

      // Add signals
      graphData.signals.forEach((signal) => {
        if (signal.agentKey === agent.accountId) {
          related.add(`signal-${signal.id}`);
        }
      });

      relationships.set(agent.accountId, related);
    });

    return relationships;
  }, [graphData]);

  // Base groups computation
  const baseGroups = useMemo(() => {
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

  // Query-based filtering with O(1) lookups - only executes when query changes due to debounce
  const searchGroups = useMemo(() => {
    // If there's a query, try to find the specific agent and show all related items
    if (query.trim()) {
      const queryLower = query.toLowerCase();
      const matchingAgent =
        agentMaps.byId.get(queryLower) || agentMaps.byName.get(queryLower);

      if (matchingAgent?.accountId) {
        const relatedItems =
          agentRelationships.get(matchingAgent.accountId) || new Set();

        // Filter groups to show only the agent and related items
        return baseGroups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => {
              return (
                item.id === matchingAgent.accountId || relatedItems.has(item.id)
              );
            }),
          }))
          .filter((group) => group.items.length > 0);
      }
    }

    return baseGroups;
  }, [query, agentMaps, agentRelationships, baseGroups]);

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
      </button>

      <CommandDialog
        open={open}
        onOpenChange={handleOpenChange}
        shouldFilter={false}
      >
        <DialogTitle className="hidden">{title}</DialogTitle>
        <CommandInput
          placeholder={title}
          value={inputValue}
          onValueChange={setInputValue}
        />
        <CommandList ref={commandListRef}>
          <CommandEmpty>No results found.</CommandEmpty>
          <SearchGroups
            groups={searchGroups}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </CommandList>
      </CommandDialog>
    </>
  );
}
