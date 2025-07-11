"use client";

import React, { useCallback, useMemo, useState } from "react";

import { Package, Radio, Search, Users, Zap } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { smallAddress } from "@torus-network/torus-utils/subspace";

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

import { useGraphData } from "./force-graph/use-graph-data";

export function PermissionGraphCommand() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
  const { graphData } = useGraphData();

  const handleSelect = useCallback(
    (nodeId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", nodeId);
      router.replace(`/?${params.toString()}`, { scroll: false });
      setOpen(false);
    },
    [router, searchParams],
  );

  const formatNodeDisplay = useCallback((node: string) => {
    return node.length > 20
      ? `${node.substring(0, 10)}...${node.substring(node.length - 8)}`
      : node;
  }, []);

  const searchData = useMemo(() => {
    if (!graphData)
      return {
        agents: [],
        emissionPermissions: [],
        namespacePermissions: [],
        signals: [],
      };

    // Extract unique agents (avoid duplicates)
    const uniqueAgents = new Map<string, (typeof graphData.agents)[number]>();
    graphData.agents.forEach((agent) => {
      if (!uniqueAgents.has(agent.accountId)) {
        uniqueAgents.set(agent.accountId, agent);
      }
    });

    const agents = Array.from(uniqueAgents.values()).map((agent) => ({
      id: agent.accountId,
      type: "agent",
      name: agent.name,
      role: agent.role,
      searchText:
        `${agent.accountId} ${agent.name} ${agent.role}`.toLowerCase(),
    }));

    // Process emission permissions
    const emissionPermissions = graphData.permissions.emission.map(
      (permission) => ({
        id: `permission-${permission.id}`,
        type: "emission",
        name: `Emission Permission`,
        grantor: smallAddress(permission.grantorAccountId),
        grantee: smallAddress(permission.granteeAccountId),
        searchText:
          `${permission.id} ${permission.grantorAccountId} ${permission.granteeAccountId} emission`.toLowerCase(),
      }),
    );

    // Process namespace permissions
    const namespacePermissions = graphData.permissions.namespace.map(
      (permission) => ({
        id: `permission-${permission.id}`,
        type: "namespace",
        name: `Capability Permission`,
        grantor: smallAddress(permission.grantorAccountId),
        grantee: smallAddress(permission.granteeAccountId),
        searchText:
          `${permission.id} ${permission.grantorAccountId} ${permission.granteeAccountId} namespace capability`.toLowerCase(),
      }),
    );

    // Process signals
    const signals = graphData.signals.map((signal) => ({
      id: `signal-${signal.id}`,
      type: "signal",
      name: signal.title,
      description: signal.description,
      agentKey: signal.agentKey,
      searchText:
        `${signal.title} ${signal.description} ${signal.agentKey} signal`.toLowerCase(),
    }));

    return { agents, emissionPermissions, namespacePermissions, signals };
  }, [graphData]);

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

  const title = isMobile
    ? "Search..."
    : "Search agents, permissions or signals...";

  return (
    <>
      <button
        className="text-sm border p-2.5 gap-6 md:w-fit w-full justify-between rounded flex
          items-center bg-background"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2 text-muted-foreground text-nowrap">
          <Search className="w-4 h-4 text-muted-foreground" />
          {title}
        </span>
        <kbd
          className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center
            gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100
            select-none"
        >
          <span className="text-xs">⌘</span>J
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="hidden">{title}</DialogTitle>

        <CommandInput placeholder={title} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {searchData.signals.length > 0 && (
            <CommandGroup heading="Signals">
              {searchData.signals.map((signal) => (
                <CommandItem
                  key={signal.id}
                  value={signal.searchText}
                  onSelect={() => handleSelect(signal.id)}
                >
                  <Radio className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{signal.name}</span>
                    <span className="text-xs text-muted-foreground">
                      From: {formatNodeDisplay(signal.agentKey)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchData.agents.length > 0 && (
            <CommandGroup heading="Agents">
              {searchData.agents.map((agent) => (
                <CommandItem
                  key={`agent-${agent.id}`}
                  value={agent.searchText}
                  onSelect={() => handleSelect(agent.id)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>
                      {agent.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({agent.role})
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNodeDisplay(agent.id)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchData.emissionPermissions.length > 0 && (
            <CommandGroup heading="Emission Permissions">
              {searchData.emissionPermissions.map((permission) => (
                <CommandItem
                  key={`emission-${permission.id}`}
                  value={permission.searchText}
                  onSelect={() => handleSelect(permission.id)}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>
                      {permission.name} from {permission.grantor} to{" "}
                      {permission.grantee}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNodeDisplay(permission.id)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchData.namespacePermissions.length > 0 && (
            <CommandGroup heading="Capabilities Permissions">
              {searchData.namespacePermissions.map((permission) => (
                <CommandItem
                  key={`namespace-${permission.id}`}
                  value={permission.searchText}
                  onSelect={() => handleSelect(permission.id)}
                >
                  <Package className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>
                      {permission.name} from {permission.grantor} to{" "}
                      {permission.grantee}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNodeDisplay(permission.id)}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
