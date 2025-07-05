"use client";

import { InfoIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import { Button } from "@torus-ts/ui/components/button";
import { graphConstants } from "./force-graph/force-graph-constants";

interface NodeColorInfo {
  color: string;
  title: string;
  description: string;
  borderColor?: string;
}

const nodeColorLegend: NodeColorInfo[] = [
  // Core Network
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
  
  // Network Participants (Blue family)
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
  
  // Permission System (Orange/Red family)
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
  
  
  // Special
  {
    color: graphConstants.nodeConfig.nodeColors.signalNode,
    title: "Demand Signal",
    description: "Signals requesting specific capabilities",
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
          Node Colors Information
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {nodeColorLegend.map((node, index) => (
          <DropdownMenuItem key={index} className="flex items-start gap-3 py-2">
            <div
              className="w-3 h-3 rounded-full mt-1"
              style={{
                backgroundColor: node.color,
                border: node.borderColor
                  ? `1px solid ${node.borderColor}`
                  : undefined,
              }}
            />
            <div className="flex-1">
              <div className="font-medium">{node.title}</div>
              <div className="text-xs text-muted-foreground">
                {node.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
