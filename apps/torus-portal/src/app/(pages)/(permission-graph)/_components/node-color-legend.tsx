"use client";

import { InfoIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import { Button } from "@torus-ts/ui/components/button";
import { GRAPH_CONSTANTS } from "./force-graph/force-graph-constants";

interface NodeColorInfo {
  color: string;
  title: string;
  description: string;
  borderColor?: string;
}

const nodeColorLegend: NodeColorInfo[] = [
  {
    color: GRAPH_CONSTANTS.COLORS.USER_NODE,
    title: "Your Agent",
    description: "Your connected wallet's agent node",
  },
  {
    color: GRAPH_CONSTANTS.COLORS.ALLOCATOR,
    title: "Allocator Main Node",
    description: "The primary allocator in the network",
    borderColor: "#000000",
  },
  {
    color: GRAPH_CONSTANTS.COLORS.ALLOCATED_AGENT,
    title: "Connected to Allocator",
    description: "Nodes directly connected to the allocator",
  },
  // Other nodes (not connected to allocator)
  {
    color: GRAPH_CONSTANTS.COLORS.BOTH,
    title: "Grantor and Grantee",
    description: "Nodes that both grant and receive permissions",
  },
  {
    color: GRAPH_CONSTANTS.COLORS.GRANTOR,
    title: "Grantor",
    description: "Nodes that grant permissions to others",
  },
  {
    color: GRAPH_CONSTANTS.COLORS.GRANTEE,
    title: "Grantee",
    description: "Nodes that receive permissions from others",
  },
  {
    color: GRAPH_CONSTANTS.COLORS.SIGNAL,
    title: "Demand Signal",
    description: "Signals requesting specific capabilities from agents",
  },
];

export function NodeColorLegend() {
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
