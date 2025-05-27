import { PermissionGraphOverview } from "../permission-graph-overview";
import { NodeDetailsCard } from "./_components/node-details-card";
import type { CustomGraphData, CustomGraphNode, PermissionDetail, CachedAgentData } from "../permission-graph-utils";
import { TooltipProvider } from "@torus-ts/ui/components/tooltip";
import { memo } from "react";
import { PermissionNodeAgentCard } from "./_components/agent-card";
import { Sheet, SheetContent,  SheetOverlay, SheetTitle,  } from "@torus-ts/ui/components/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetail[];
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBackgroundClick?: () => void;
}

export const PermissionGraphNodeDetails = memo(function PermissionGraphNodeDetails({ 
  selectedNode, 
  graphData, 
  permissionDetails,
  getCachedAgentData,
  setCachedAgentData,
  isOpen, 
  onOpenChange,
  onBackgroundClick 
}: PermissionGraphDetailsProps) {
  if (!selectedNode) {
    return <span> oi</span>
  //   return <PermissionGraphOverview graphData={graphData} />;
  }
  
  return (
<Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
  <SheetOverlay className="bg-transparent overflow-hidden" />
  
  <SheetContent
    className="z-[100] w-full max-w-md sm:max-w-lg md:w-[33%] lg:w-[33%] xl:w-[33%] overflow-hidden [&>button]:hidden"
    side="right"
    onPointerDownOutside={(e) => e.preventDefault()} 
    onInteractOutside={(e) => e.preventDefault()}
  >
    <div className="flex flex-col gap-2 w-full h-full sm:overflow-y-auto xl:overflow-hidden">
      {/*Must to remove annoying error */}
      <VisuallyHidden><SheetTitle>AgentDetails</SheetTitle></VisuallyHidden>
      <PermissionNodeAgentCard 
        nodeId={selectedNode.id}
        fullAddress={selectedNode.fullAddress}
        onClose={() => onOpenChange(false)}
        getCachedAgentData={getCachedAgentData}
        setCachedAgentData={setCachedAgentData}
      />
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
    </div>
  </SheetContent>
</Sheet>

  );
});