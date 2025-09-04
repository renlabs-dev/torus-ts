"use client";

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
import { Check, Network } from "lucide-react";
import React, { useState } from "react";
import { getAvailableSwarms } from "./force-graph-2d/force-graph-2d-utils";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-types";

interface SwarmSelectionCommandProps {
  graphData: CustomGraphData;
  allocatorAddress: string;
  selectedSwarmId?: string | null;
  onSwarmSelect: (swarmId: string, rootAgentNode: CustomGraphNode) => void;
  onShowAll: () => void;
}

export function SwarmSelectionCommand({
  graphData,
  allocatorAddress,
  selectedSwarmId,
  onSwarmSelect,
  onShowAll,
}: SwarmSelectionCommandProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  const availableSwarms = getAvailableSwarms(
    graphData.nodes,
    graphData.links,
    allocatorAddress,
  );

  // Get current selection display text
  const currentSelectionText = selectedSwarmId
    ? availableSwarms.find((s) => s.id === selectedSwarmId)?.rootAgentName ||
      "Unknown Swarm"
    : "All Networks";

  const handleSelect = (value: string) => {
    if (value === "all") {
      onShowAll();
    } else {
      const swarm = availableSwarms.find((s) => s.id === value);
      if (!swarm) return;

      const rootAgentNode = graphData.nodes.find(
        (node) => node.id === swarm.rootAgentId,
      );
      if (!rootAgentNode) return;

      onSwarmSelect(value, rootAgentNode);
    }
    setOpen(false);
  };

  const formatNodeDisplay = (nodeId: string) => {
    return nodeId.length > 20
      ? `${nodeId.substring(0, 10)}...${nodeId.substring(nodeId.length - 8)}`
      : nodeId;
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const title = isMobile ? "Select network..." : "Select network to view...";
  const buttonText = selectedSwarmId
    ? `Viewing ${currentSelectionText} swarm`
    : "Select a swarm";

  return (
    <>
      <button
        className="bg-background flex w-full items-center justify-between gap-6 rounded border p-2.5 text-sm md:w-fit"
        onClick={() => setOpen(true)}
      >
        <span className="text-muted-foreground flex min-w-0 flex-1 items-center gap-2 truncate">
          <Network className="text-muted-foreground h-4 w-4 flex-shrink-0" />
          <span className="truncate">{buttonText}</span>
        </span>
        <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>S
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <DialogTitle className="hidden">{title}</DialogTitle>

        <CommandInput placeholder={title} />
        <CommandList>
          <CommandEmpty>No networks found.</CommandEmpty>

          <CommandGroup heading="Network View">
            <CommandItem
              value="all networks view show everything"
              onSelect={() => handleSelect("all")}
            >
              <Network className="mr-2 h-4 w-4" />
              <div className="flex flex-1 flex-col">
                <div className="flex items-center justify-between">
                  <span>All Networks</span>
                  {!selectedSwarmId && <Check className="ml-2 h-4 w-4" />}
                </div>
                <span className="text-muted-foreground text-xs">
                  Show complete network view
                </span>
              </div>
            </CommandItem>
          </CommandGroup>

          {availableSwarms.length > 0 && (
            <CommandGroup heading="Available Swarms">
              {availableSwarms.map((swarm) => {
                const isSelected = selectedSwarmId === swarm.id;
                const permissionTypesText =
                  swarm.permissionTypes.length > 0
                    ? swarm.permissionTypes.join(", ")
                    : "mixed";

                return (
                  <CommandItem
                    key={swarm.id}
                    value={`${swarm.rootAgentName} ${swarm.rootAgentId} ${permissionTypesText} ${swarm.nodeCount}`}
                    onSelect={() => handleSelect(swarm.id)}
                  >
                    <Network className="mr-2 h-4 w-4" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center justify-between">
                        <span>
                          {swarm.rootAgentName}{" "}
                          <span className="text-muted-foreground text-xs">
                            ({swarm.nodeCount} nodes)
                          </span>
                        </span>
                        {isSelected && <Check className="ml-2 h-4 w-4" />}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formatNodeDisplay(swarm.rootAgentId)}
                        </span>
                        <span className="text-muted-foreground">
                          {permissionTypesText} permissions
                        </span>
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
  );
}
