import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@torus-ts/ui/components/sheet";

import { PermissionGraphOverview } from "../permission-graph-overview";
import type {
  allPermissions,
  CachedAgentData,
  ComputedWeightsList,
  CustomGraphData,
  CustomGraphNode,
  SignalsList,
} from "../permission-graph-types";
import { AgentCardContainer } from "./graph-sheet-agent-card/agent-card-container";
import { GraphSheetDetails } from "./graph-sheet-details/graph-sheet-details";
import { GraphSheetDetailsPermission } from "./graph-sheet-details/graph-sheet-details-permission";
import { GraphSheetDetailsSignal } from "./graph-sheet-details/graph-sheet-details-signal";

interface GraphSheetProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  allPermissions?: allPermissions;
  allComputedWeights?: ComputedWeightsList;
  allSignals?: SignalsList;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function GraphSheet(props: GraphSheetProps) {
  if (!props.selectedNode) {
    return <PermissionGraphOverview graphData={props.graphData} />;
  }

  const isSignalNode = props.selectedNode.nodeType === "signal";
  const isPermissionNode = props.selectedNode.nodeType === "permission";

  return (
    <Sheet open={props.isOpen} onOpenChange={props.onOpenChange} modal={false}>
      <SheetContent
        className="z-[100] w-full md:min-w-[30em] max-h-screen overflow-y-auto space-y-2"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <SheetHeader>
          <SheetTitle>
            {isSignalNode
              ? "Signal details"
              : isPermissionNode
                ? "Permission details"
                : "Agent details"}
          </SheetTitle>
        </SheetHeader>

        {isSignalNode ? (
          <GraphSheetDetailsSignal selectedNode={props.selectedNode} />
        ) : isPermissionNode ? (
          <GraphSheetDetailsPermission
            selectedNode={props.selectedNode}
            allPermissions={props.allPermissions}
          />
        ) : (
          <div className="w-full flex flex-col gap-4">
            <AgentCardContainer
              nodeId={props.selectedNode.id}
              fullAddress={props.selectedNode.fullAddress}
              allComputedWeights={props.allComputedWeights}
              getCachedAgentData={props.getCachedAgentData}
              setCachedAgentData={props.setCachedAgentData}
            />

            <GraphSheetDetails
              selectedNode={props.selectedNode}
              graphData={props.graphData}
              allPermissions={props.allPermissions}
              getCachedAgentData={props.getCachedAgentData}
              setCachedAgentData={props.setCachedAgentData}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
