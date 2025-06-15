import { NodeDetails } from "./_components/node-details";
import type {
  CustomGraphData,
  CustomGraphNode,
  PermissionDetails,
  CachedAgentData,
  ComputedWeightsList,
  SignalsList,
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
import { SignalDetails } from "./_components/signal-details";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetails;
  allComputedWeights?: ComputedWeightsList;
  allSignals?: SignalsList;
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
    allComputedWeights,
    allSignals: _allSignals,
    getCachedAgentData,
    setCachedAgentData,
    isOpen,
    onOpenChange,
    onBackgroundClick,
  }: PermissionGraphDetailsProps) {
    if (!selectedNode) {
      return <PermissionGraphOverview graphData={graphData} />;
    }

    const isSignalNode = selectedNode.nodeType === "signal";

    return (
      <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
        <SheetContent
          className="z-[100] w-full md:min-w-[30em] max-h-screen overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>
              {isSignalNode ? "Signal details" : "Agent details"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-8 items-start justify-start w-full h-full">
            {isSignalNode ? (
              <SignalDetails selectedNode={selectedNode} />
            ) : (
              <>
                <div className="w-full">
                  <PermissionNodeAgentCard
                    nodeId={selectedNode.id}
                    fullAddress={selectedNode.fullAddress}
                    allComputedWeights={allComputedWeights}
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
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  },
);
