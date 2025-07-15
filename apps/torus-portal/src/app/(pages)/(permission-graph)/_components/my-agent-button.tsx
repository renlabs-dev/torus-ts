"use client";

import { Diameter } from "lucide-react";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";

import { useGraphData } from "./force-graph/use-graph-data";
import type { CustomGraphNode } from "./permission-graph-types";

interface MyAgentButtonProps {
  onNodeClick: (node: CustomGraphNode) => void;
}

export function MyAgentButton({ onNodeClick }: MyAgentButtonProps) {
  const { selectedAccount } = useTorus();
  const { graphData } = useGraphData();

  if (!selectedAccount?.address || !graphData) {
    return null;
  }

  const userNode = graphData.nodes.find(
    (node) => node.id.toLowerCase() === selectedAccount.address.toLowerCase(),
  );

  if (!userNode) {
    return null;
  }

  const handleClick = () => {
    onNodeClick(userNode);
  };

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      className="h-[2.60rem] rounded animate-fade-up animate-delay-200"
    >
      <Diameter className="w-4 h-4 mr-0.5" />
      Open my agent
    </Button>
  );
}
