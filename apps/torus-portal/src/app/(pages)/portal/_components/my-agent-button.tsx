"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Diameter } from "lucide-react";
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
      className="animate-fade-up animate-delay-200 h-[2.60rem] rounded"
    >
      <Diameter className="mr-0.5 h-4 w-4" />
      Open my agent
    </Button>
  );
}
