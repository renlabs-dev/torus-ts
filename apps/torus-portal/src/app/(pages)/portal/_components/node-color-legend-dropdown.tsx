"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@torus-ts/ui/components/dropdown-menu";
import { InfoIcon } from "lucide-react";
import { graphConstants } from "./force-graph/force-graph-constants";

// Shape components for different node types
function SphereShape({
  color,
  borderColor,
}: {
  color: string;
  borderColor?: string;
}) {
  return (
    <div
      className="h-3 w-3 flex-shrink-0 rounded-full"
      style={{
        backgroundColor: color,
        border: borderColor ? `1px solid ${borderColor}` : undefined,
      }}
    />
  );
}

function IcosahedronShape({
  color,
  borderColor,
}: {
  color: string;
  borderColor?: string;
}) {
  return (
    <svg width="12" height="12" viewBox="0 0 10 10" className="flex-shrink-0">
      <polygon
        points="6,1 10,4 8,9 4,9 2,4"
        fill={color}
        stroke={borderColor}
        strokeWidth={borderColor ? "0.5" : "0"}
      />
    </svg>
  );
}

function TetrahedronShape({
  color,
  borderColor,
}: {
  color: string;
  borderColor?: string;
}) {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" className="flex-shrink-0">
      <polygon
        points="6,2 10,10 2,10"
        fill={color}
        stroke={borderColor}
        strokeWidth={borderColor ? "0.5" : "0"}
      />
    </svg>
  );
}

function LineShape({ color }: { color: string }) {
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" className="flex-shrink-0">
      <line x1="2" y1="6" x2="22" y2="6" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function NodeShape({
  shape,
  color,
  borderColor,
}: {
  shape: "sphere" | "icosahedron" | "tetrahedron";
  color: string;
  borderColor?: string;
}) {
  switch (shape) {
    case "sphere":
      return <SphereShape color={color} borderColor={borderColor} />;
    case "icosahedron":
      return <IcosahedronShape color={color} borderColor={borderColor} />;
    case "tetrahedron":
      return <TetrahedronShape color={color} borderColor={borderColor} />;
    default:
      return <SphereShape color={color} borderColor={borderColor} />;
  }
}

function ConnectionShape({ color }: { color: string }) {
  return <LineShape color={color} />;
}

interface NodeColorInfo {
  color: string;
  title: string;
  description: string;
  borderColor?: string;
  shape: "sphere" | "icosahedron" | "tetrahedron";
}

interface ConnectionInfo {
  color: string;
  title: string;
  description: string;
}

interface NodeCategory {
  label: string;
  nodes: NodeColorInfo[];
}

interface ConnectionCategory {
  label: string;
  connections: ConnectionInfo[];
}

const nodeColorCategories: NodeCategory[] = [
  {
    label: "Network Participants",
    nodes: [
      {
        color: graphConstants.nodeConfig.nodeColors.rootNode,
        title: "Root Agent",
        description: "Agents verified and whitelisted in the network",
        shape: "sphere",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.targetNode,
        title: "Target Agent",
        description: "Agents that are targets of permissions",
        shape: "sphere",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.allocator,
        title: "Allocator",
        description: "The primary allocator node in the network",
        borderColor: "#000000",
        shape: "sphere",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.userNode,
        title: "Your Agent",
        description: "Your connected wallet's agent node",
        shape: "sphere",
      },
    ],
  },
  {
    label: "Permission System",
    nodes: [
      {
        color: graphConstants.nodeConfig.nodeColors.emissionPermissionNode,
        title: "Stream Permission",
        description: "Controls token streams and distributions",
        shape: "icosahedron",
      },
      {
        color: graphConstants.nodeConfig.nodeColors.namespacePermissionNode,
        title: "Capability Permission",
        description: "Controls access to specific capabilities",
        shape: "icosahedron",
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
        shape: "tetrahedron",
      },
    ],
  },
];

const connectionCategories: ConnectionCategory[] = [
  {
    label: "Node Connections",
    connections: [
      {
        color: "#6b7280",
        title: "Delegation Paths",
        description:
          "Lines connecting nodes representing delegation relationships and permission flows",
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
          className="animate-fade-up animate-delay-[900ms] h-8"
        >
          <InfoIcon className="mr-1 h-4 w-4" />
          Graph Legend
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        {nodeColorCategories.map((category) => (
          <div key={category.label}>
            <DropdownMenuLabel className="text-foreground px-2 py-1.5 text-sm font-semibold">
              {category.label}
            </DropdownMenuLabel>
            {category.nodes.map((node, nodeIndex) => (
              <DropdownMenuItem
                key={`${category.label}-${nodeIndex}`}
                className="focus:bg-muted/50 flex cursor-default items-start gap-3 px-2 py-2"
              >
                <div className="mt-0.5">
                  <NodeShape
                    shape={node.shape}
                    color={node.color}
                    borderColor={node.borderColor}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">
                    {node.title}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {node.description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="my-1" />
          </div>
        ))}
        {connectionCategories.map((category) => (
          <div key={category.label}>
            <DropdownMenuLabel className="text-foreground px-2 py-1.5 text-sm font-semibold">
              {category.label}
            </DropdownMenuLabel>
            {category.connections.map((connection, connectionIndex) => (
              <DropdownMenuItem
                key={`${category.label}-${connectionIndex}`}
                className="focus:bg-muted/50 flex cursor-default items-start gap-3 px-2 py-2"
              >
                <div className="mt-1">
                  <ConnectionShape color={connection.color} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium leading-tight">
                    {connection.title}
                  </div>
                  <div className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                    {connection.description}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
