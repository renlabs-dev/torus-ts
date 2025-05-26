import { PermissionGraphOverview } from "../permission-graph-overview";
import { NodeDetailsCard } from "./_components/node-details-card";
import type { CustomGraphData, CustomGraphNode, PermissionDetail, CachedAgentData } from "../permission-graph-utils";
import { TooltipProvider } from "@torus-ts/ui/components/tooltip";
import { memo } from "react";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetail[];
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  onBackgroundClick?: () => void;
}

export const PermissionGraphNodeDetails = memo(function PermissionGraphNodeDetails({ 
  selectedNode, 
  graphData, 
  permissionDetails,
  getCachedAgentData,
  setCachedAgentData,
  onBackgroundClick 
}: PermissionGraphDetailsProps) {
  if (!selectedNode) {
    return <PermissionGraphOverview graphData={graphData} />;
  }
  
  return (
    <TooltipProvider>    
      <NodeDetailsCard
        selectedNode={selectedNode} 
        graphData={graphData}
        permissionDetails={permissionDetails}
        getCachedAgentData={getCachedAgentData}
        setCachedAgentData={setCachedAgentData}
        onBackgroundClick={onBackgroundClick}
      />
  </TooltipProvider>

  );
});