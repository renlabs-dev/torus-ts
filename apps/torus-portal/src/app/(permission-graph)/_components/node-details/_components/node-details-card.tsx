// import { useMemo } from "react";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@torus-ts/ui/components/accordion";
import { Card } from "@torus-ts/ui/components/card";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { formatDuration, formatScope } from "../../permission-graph-utils";
import type {
  CachedAgentData,
  CustomGraphData,
  CustomGraphNode,
  PermissionDetails,
  PermissionWithType,
} from "../../permission-graph-types";
import { ActionButtons } from "./action-buttons";
import { LinkButtons } from "./link-buttons";
import { useMemo } from "react";

interface NodeDetailsCardProps {
  nodePermissions: PermissionWithType[];
  selectedNode?: CustomGraphNode;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetails;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  onBackgroundClick?: () => void;
}

export function NodeDetailsCard({
  graphData,
  nodePermissions,
  permissionDetails,
}: NodeDetailsCardProps) {
  const calculateTimeRemaining = useMemo(
    () =>
      (createdAt: Date, duration: number): number => {
        const endDate = new Date(
          createdAt.getTime() + duration * 24 * 60 * 60 * 1000,
        );
        const timeRemainingMs = endDate.getTime() - new Date().getTime();
        const daysRemaining = Math.ceil(
          timeRemainingMs / (24 * 60 * 60 * 1000),
        );
        return daysRemaining;
      },
    [],
  );

  if (!graphData) return null;

  return (
    <Card className="w-full flex-1 flex flex-col z-50 border-none">
      <h2 className="text-lg font-semibold flex-shrink-0 mb-4">
        Applied Permissions
      </h2>

      <ScrollArea className="h-full max-h-[50vh] md:max-h-[calc(100vh-28rem)]">
        {nodePermissions.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {nodePermissions.map((permission) => {
              const details = permissionDetails?.find(
                (p) =>
                  p.grantor_key === permission.source &&
                  p.grantee_key === permission.target,
              );
              const isOutgoing = permission.type === "outgoing";
              const connectedNode = graphData.nodes.find(
                (n) =>
                  n.id === (isOutgoing ? permission.target : permission.source),
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

              return (
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
                          {smallAddress(String(details?.permission_id))}
                        </span>
                      </div>
                      <LinkButtons
                        grantor_key={details?.grantor_key}
                        grantee_key={details?.grantee_key}
                        scope={details?.scope}
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
                        <ActionButtons connectedAddress={connectedAddress} />
                      </div>
                    </div>
                    {details && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-xs text-gray-500">Scope</span>
                            <div className="text-sm text-gray-300">
                              {formatScope(details.scope)}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">
                              Expires in
                            </span>
                            <div className="text-sm text-gray-300">
                              {formatDuration(
                                Math.max(
                                  calculateTimeRemaining(
                                    details.createdAt,
                                    Number(details.duration),
                                  ),
                                  0,
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
                              {details.execution_count}
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

                          {details.parent_id && (
                            <div>
                              <span className="text-xs text-gray-500">
                                Parent ID
                              </span>
                              <div className="text-sm text-gray-300">
                                {details.parent_id}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <span className="text-gray-500 text-center mt-8">
            No permissions found for this agent
          </span>
        )}
      </ScrollArea>
    </Card>
  );
}
