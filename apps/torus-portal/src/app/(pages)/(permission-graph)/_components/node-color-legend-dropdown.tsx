"use client";

import { InfoIcon } from "lucide-react";

import { Button } from "@torus-ts/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";

import { graphConstants } from "./force-graph/force-graph-constants";

interface NodeColorInfo {
  color: string;
  title: string;
  description: string;
  borderColor?: string;
}

interface NodeCategory {
  label: string;
  nodes: NodeColorInfo[];
}

const nodeColorCategories: NodeCategory[] = [
  {
    label: "Network Participants",
    nodes: [
      {
        color: graphConstants.nodeConfig.nodeColors.rootNode,
        title: "Whitelisted Agent",
        description: "Agents verified and whitelisted in the network",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.targetNode,
        title: "Target Agent",
        description: "Agents that are targets of permissions",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.allocator,
        title: "Allocator",
        description: "The primary allocator node in the network",
        borderColor: "#000000",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.userNode,
        title: "Your Agent",
        description: "Your connected wallet's agent node",
      },
    ],
  },
  {
    label: "Permission System",
    nodes: [
      {
        color: graphConstants.nodeConfig.nodeColors.emissionPermissionNode,
        title: "Emission Permission",
        description: "Controls token emissions and distributions",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.namespacePermissionNode,
        title: "Namespace Permission",
        description: "Controls access to specific namespaces",
      },
    ],
  },
  {
    label: "Special Nodes",
    nodes: [
      {
        color: graphConstants.nodeConfig.nodeColors.signalNode,
        title: "Demand Signal",
        description: "Signals requesting specific capabilities",
      },
    ],
  },
];

export function NodeColorLegendDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="link"
          size="sm"
          className="h-8 animate-fade-up animate-delay-[600ms]"
        >
          <InfoIcon className="w-4 h-4 mr-2" />
          Nodes Information
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {nodeColorCategories.map((category, categoryIndex) => (
          <div key={category.label}>
            <DropdownMenuLabel className="text-sm font-semibold text-foreground px-2 py-1.5">
              {category.label}
            </DropdownMenuLabel>
            {category.nodes.map((node, nodeIndex) => (
              <DropdownMenuItem
                key={`${category.label}-${nodeIndex}`}
                className="flex items-start gap-3 py-2 px-2 cursor-default focus:bg-muted/50"
              >
                <div
                  className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                  style={{
                    backgroundColor: node.color,
                    border: node.borderColor
                      ? `1px solid ${node.borderColor}`
                      : undefined,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm leading-tight">
                    {node.title}
                  </div>
                  <div className="text-xs text-Smuted-foreground mt-0.5 leading-relaxed">
                    {node.description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            {categoryIndex < nodeColorCategories.length - 1 && (
              <DropdownMenuSeparator className="my-1" />
            )}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
