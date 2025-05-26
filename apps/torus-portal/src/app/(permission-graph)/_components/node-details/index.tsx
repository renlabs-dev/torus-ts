import { PermissionGraphOverview } from "../permission-graph-overview";
import { NodeDetailsCard } from "./_components/node-details-card";
import type { CustomGraphData, CustomGraphNode, PermissionDetail, CachedAgentData } from "../permission-graph-utils";
import { TooltipProvider } from "@torus-ts/ui/components/tooltip";
import { memo } from "react";
import { PermissionNodeAgentCard } from "./_components/agent-card";

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
      <div className="flex flex-col gap-2">
        <PermissionNodeAgentCard 
          nodeId={selectedNode.id}
          fullAddress={selectedNode.fullAddress}
          getCachedAgentData={getCachedAgentData}
          setCachedAgentData={setCachedAgentData}
          />
        <NodeDetailsCard
          selectedNode={selectedNode} 
          graphData={graphData}
          permissionDetails={permissionDetails}
          getCachedAgentData={getCachedAgentData}
          setCachedAgentData={setCachedAgentData}
          onBackgroundClick={onBackgroundClick}
        />
    </div>
  </TooltipProvider>

  );
});