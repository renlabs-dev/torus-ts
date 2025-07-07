"use client";

import { User } from "lucide-react";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-types";

interface MyAgentButtonProps {
  graphData: CustomGraphData | null;
  onNodeClick: (node: CustomGraphNode) => void;
}

export function MyAgentButton({ graphData, onNodeClick }: MyAgentButtonProps) {
  const { selectedAccount } = useTorus();

  // Don't show button if not logged in or no graph data
  if (!selectedAccount?.address || !graphData) {
    return null;
  }

  // Find if the logged-in user's address exists as a node in the graph
  const userNode = graphData.nodes.find(
    (node) => node.id.toLowerCase() === selectedAccount.address.toLowerCase(),
  );

  // Don't show button if user doesn't have an agent node
  if (!userNode) {
    return null;
  }

  const handleClick = () => {
    onNodeClick(userNode);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className="h-9 animate-fade-down animate-delay-200 w-full md:w-fit"
    >
      <User className="w-4 h-4 mr-2" />
      View my agent
    </Button>
  );
}
