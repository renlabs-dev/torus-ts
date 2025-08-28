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

  // Get current selection from URL
  const selectedId = searchParams.get("id");

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

    // Process emission permissions (ensure unique keys)
    const emissionPermissions = graphData.permissions.emission.map(
      (permission, index) => {
        // Find agent names for delegator and recipient
        const delegatorAgent = uniqueAgents.get(permission.delegatorAccountId);
        const recipientAgent = uniqueAgents.get(permission.recipientAccountId);

        return {
          id: `permission-${permission.id}`,
          type: "emission",
          name: `Emission Permission`,
          grantor: smallAddress(permission.delegatorAccountId),
          grantee: smallAddress(permission.recipientAccountId),
          grantorName: delegatorAgent?.name,
          granteeName: recipientAgent?.name,
          searchText:
            `${permission.id} ${permission.delegatorAccountId} ${permission.recipientAccountId} ${delegatorAgent?.name ?? ""} ${recipientAgent?.name ?? ""} emission`.toLowerCase(),
          uniqueKey: `emission-${permission.id}-${index}`,
        };
      },
    );

    // Process namespace permissions (ensure unique keys)
    const namespacePermissions = graphData.permissions.namespace.map(
      (permission, index) => {
        // Find agent names for delegator and recipient
        const delegatorAgent = uniqueAgents.get(permission.delegatorAccountId);
        const recipientAgent = uniqueAgents.get(permission.recipientAccountId);

        return {
          id: `permission-${permission.id}`,
          type: "namespace",
          name: `Capability Permission`,
          grantor: smallAddress(permission.delegatorAccountId),
          grantee: smallAddress(permission.recipientAccountId),
          grantorName: delegatorAgent?.name,
          granteeName: recipientAgent?.name,
          searchText:
            `${permission.id} ${permission.delegatorAccountId} ${permission.recipientAccountId} ${delegatorAgent?.name ?? ""} ${recipientAgent?.name ?? ""} namespace capability`.toLowerCase(),
          uniqueKey: `namespace-${permission.id}-${index}`,
        };
      },
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
        className="bg-background flex w-full items-center justify-between gap-6 rounded border p-2.5 text-sm md:w-fit"
        onClick={() => setOpen(true)}
      >
        <span className="text-muted-foreground flex items-center gap-2 text-nowrap">
          <Search className="text-muted-foreground h-4 w-4" />
          {title}
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

          {searchData.signals.length > 0 && (
            <CommandGroup heading="Signals">
              {searchData.signals.map((signal) => {
                const isSelected = selectedId === signal.id;
                return (
                  <CommandItem
                    key={signal.id}
                    value={signal.searchText}
                    onSelect={() => handleSelect(signal.id)}
                  >
                    <Radio className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <span>{signal.name}</span>
                        {isSelected && <Check className="ml-2 h-4 w-4" />}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        From: {formatNodeDisplay(signal.agentKey)}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {searchData.agents.length > 0 && (
            <CommandGroup heading="Agents">
              {searchData.agents.map((agent) => {
                const isSelected = selectedId === agent.id;
                return (
                  <CommandItem
                    key={`agent-${agent.id}`}
                    value={agent.searchText}
                    onSelect={() => handleSelect(agent.id)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <span>
                          {agent.name}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({agent.role})
                          </span>
                        </span>
                        {isSelected && <Check className="ml-2 h-4 w-4" />}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatNodeDisplay(agent.id)}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {searchData.emissionPermissions.length > 0 && (
            <CommandGroup heading="Emission Permissions">
              {searchData.emissionPermissions.map((permission) => {
                const isSelected = selectedId === permission.id;
                return (
                  <CommandItem
                    key={permission.uniqueKey}
                    value={permission.searchText}
                    onSelect={() => handleSelect(permission.id)}
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <span>
                          {permission.name} from{" "}
                          {permission.grantorName ?? permission.grantor} to{" "}
                          {permission.granteeName ?? permission.grantee}
                        </span>
                        {isSelected && <Check className="ml-2 h-4 w-4" />}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatNodeDisplay(permission.id)}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {searchData.namespacePermissions.length > 0 && (
            <CommandGroup heading="Capabilities Permissions">
              {searchData.namespacePermissions.map((permission) => {
                const isSelected = selectedId === permission.id;
                return (
                  <CommandItem
                    key={permission.uniqueKey}
                    value={permission.searchText}
                    onSelect={() => handleSelect(permission.id)}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <span>
                          {permission.name} from{" "}
                          {permission.grantorName ?? permission.grantor} to{" "}
                          {permission.granteeName ?? permission.grantee}
                        </span>
                        {isSelected && <Check className="ml-2 h-4 w-4" />}
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {formatNodeDisplay(permission.id)}
                      </span>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
