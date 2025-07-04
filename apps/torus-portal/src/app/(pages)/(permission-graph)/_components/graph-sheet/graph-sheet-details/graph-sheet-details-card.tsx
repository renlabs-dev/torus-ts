// import { useMemo } from "react";
import { smallAddress } from "@torus-network/torus-utils/subspace";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Card } from "@torus-ts/ui/components/card";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";

import type {
  allPermissions,
  CachedAgentData,
  CustomGraphData,
  CustomGraphNode,
  PermissionWithType,
} from "../../permission-graph-types";
import { formatDuration, formatScope } from "../../permission-graph-utils";
import { GraphSheetDetailsActionButtons } from "./graph-sheet-details-action-buttons";
import { GraphSheetDetailsLinkButtons } from "./graph-sheet-details-link-buttons";
import { GraphSheetDetailsSignalsAccordion } from "./graph-sheet-details-signals-accordion";

interface NodeDetailsCardProps {
  nodePermissions: PermissionWithType[];
  selectedNode?: CustomGraphNode;
  graphData: CustomGraphData | null;
  allPermissions?: allPermissions;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
}

export function NodeDetailsCard({
  graphData,
  nodePermissions,
  allPermissions,
  selectedNode,
}: NodeDetailsCardProps) {
  if (!graphData) return null;

  const processedPermissions = nodePermissions.map((permission) => {
    const details = allPermissions?.find(
      (p) =>
        p.permissions.grantorAccountId === permission.source &&
        p.permissions.granteeAccountId === permission.target,
    );
    const isOutgoing = permission.type === "outgoing";
    const connectedNode = graphData.nodes.find(
      (n) => n.id === (isOutgoing ? permission.target : permission.source),
    );
    const connectedAddress =
      connectedNode?.fullAddress ?? connectedNode?.id ?? "";

    const sourceId =
      typeof permission.source === "object"
        ? permission.source.id
        : permission.source;
    const targetId =
      typeof permission.target === "object"
        ? permission.target.id
        : permission.target;

    return {
      permission,
      details,
      isOutgoing,
      connectedAddress,
      sourceId,
      targetId,
    };
  });

  const PermissionsContent = () => (
    <ScrollArea className="h-[calc(100vh-30rem)]">
      {processedPermissions.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {processedPermissions.map(
            ({ details, isOutgoing, connectedAddress, sourceId, targetId }) => (
              <AccordionItem
                key={`${sourceId}-${targetId}`}
                value={`${sourceId}-${targetId}`}
                className="border bg-accent mb-2"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-700/50 text-left">
                  <div className="flex flex-col gap-1 w-full pr-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">
                        {isOutgoing ? "← Granted " : "→ Received "}
                        Permission{" "}
                        {smallAddress(
                          String(details?.permissions.permissionId),
                        )}
                      </span>
                    </div>
                    <GraphSheetDetailsLinkButtons
                      grantor_key={details?.permissions.grantorAccountId}
                      grantee_key={details?.permissions.granteeAccountId}
                      scope={
                        details?.emission_permissions
                          ? "EMISSION"
                          : details?.namespace_permissions
                            ? "NAMESPACE"
                            : "UNKNOWN"
                      }
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                  <div className="flex flex-col gap-1 space-between">
                    <div className="flex items-center gap-2 text-gray-400 font-mono">
                      <span className="text-xs text-gray-500">
                        {isOutgoing ? "Granted To" : "Received From"}
                      </span>
                    </div>
                    <div className="flex flex-row justify-between gap-2">
                      <span>{smallAddress(connectedAddress, 10)}</span>
                      <GraphSheetDetailsActionButtons
                        connectedAddress={connectedAddress}
                      />
                    </div>
                  </div>
                  {details && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-xs text-gray-500">Scope</span>
                          <div className="text-sm text-gray-300">
                            {formatScope(
                              details.emission_permissions
                                ? "emission"
                                : details.namespace_permissions
                                  ? "namespace"
                                  : "",
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">
                            {details.permissions.durationType === "indefinite"
                              ? "Duration"
                              : "Expires in"}
                          </span>
                          <div className="text-sm text-gray-300">
                            {formatDuration(
                              Number(
                                details.permissions.durationBlockNumber ?? 0,
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-xs text-gray-500">
                            Executions
                          </span>
                          <div className="text-sm text-gray-300">
                            {details.permissions.executionCount}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">
                            Permission ID
                          </span>
                          <div className="text-sm text-gray-300">
                            {smallAddress(connectedAddress, 8)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          {/* TODO ADD ENFORCEMENT */}
                          {/* <span className="text-xs text-gray-500">
                          Enforcement
                        </span> */}
                          <div className="font-mono text-gray-300 break-all">
                            {/*todo edit*/}
                            {/* {details.enforcement} */}
                            {/* {smallAddress(details.enforcement, 4)} */}
                          </div>
                        </div>

                        {/* Parent ID removed as not available in new schema */}
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ),
          )}
        </Accordion>
      ) : (
        <span className="text-gray-500 text-center mt-8">
          No permissions found for this agent
        </span>
      )}
    </ScrollArea>
  );

  return (
    <Card className="w-full flex-1 flex flex-col z-50 border-none">
      <Tabs defaultValue="permissions" className="w-full flex flex-col flex-1">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="flex-1 mt-0">
          <PermissionsContent />
        </TabsContent>

        <TabsContent value="signals" className="flex-1 mt-0">
          <ScrollArea className="h-[calc(100vh-32rem)] pb-4 md:pb-0">
            <GraphSheetDetailsSignalsAccordion selectedNode={selectedNode} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
