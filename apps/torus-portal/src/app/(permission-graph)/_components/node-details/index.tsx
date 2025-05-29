import { NodeDetails } from "./_components/node-details";
import type {
  CustomGraphData,
  CustomGraphNode,
  PermissionDetails,
  CachedAgentData,
} from "../permission-graph-types";
import { memo } from "react";
import { PermissionNodeAgentCard } from "./_components/agent-card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@torus-ts/ui/components/sheet";
import { PermissionGraphOverview } from "../permission-graph-overview";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetails;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onBackgroundClick?: () => void;
}

export const PermissionGraphNodeDetails = memo(
  function PermissionGraphNodeDetails({
    selectedNode,
    graphData,
    permissionDetails,
    getCachedAgentData,
    setCachedAgentData,
    isOpen,
    onOpenChange,
    onBackgroundClick,
  }: PermissionGraphDetailsProps) {
    if (!selectedNode) {
      return <PermissionGraphOverview graphData={graphData} />;
    }

    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          // w-full max-w-md sm:max-w-lg md:w-[33%] lg:w-[33%] xl:w-[33%] overflow-hidden
          className="z-[100] w-full md:min-w-[30em]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Agent details</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-8 items-start justify-start w-full h-full">
            <div className="w-full">
              <PermissionNodeAgentCard
                nodeId={selectedNode.id}
                fullAddress={selectedNode.fullAddress}
                getCachedAgentData={getCachedAgentData}
                setCachedAgentData={setCachedAgentData}
              />
            </div>

            <NodeDetails
              selectedNode={selectedNode}
              graphData={graphData}
              permissionDetails={permissionDetails}
              getCachedAgentData={getCachedAgentData}
              setCachedAgentData={setCachedAgentData}
              onBackgroundClick={onBackgroundClick}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  },
);
