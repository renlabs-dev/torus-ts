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
  PermissionDetail,
  PermissionWithType,
} from "../../permission-graph-utils";
import { ActionButtons } from "./action-buttons";
import { LinkButtons } from "./link-buttons";
import { useMemo } from "react";

interface NodeDetailsSkeletonProps {
  sortedPermissions: PermissionWithType[];
  nodePermissions: PermissionWithType[];
  selectedNode?: CustomGraphNode;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetail[];
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  onBackgroundClick?: () => void;
}

export function NodeDetailsSkeleton({
  sortedPermissions,
  graphData,
  permissionDetails,
}: NodeDetailsSkeletonProps) {
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
    <div className="flex flex-col gap-4 h-[27em] w-[27em] z-50">
      <Card className="w-[27em] flex-1 p-4 flex flex-col z-50">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">
          Applied Permissions
        </h2>

        {sortedPermissions.length > 0 ? (
          <ScrollArea className="flex-1 min-h-0 max-h-full p-2">
            <div className="flex max-h-96 overflow-auto">
              <Accordion type="single" collapsible className="w-full">
                {sortedPermissions.map((permission) => {
                  const details = permissionDetails?.find(
                    (p) =>
                      p.grantor_key === permission.source &&
                      p.grantee_key === permission.target,
                  );
                  const isOutgoing = permission.type === "outgoing";
                  const connectedNode = graphData.nodes.find(
                    (n) =>
                      n.id ===
                      (isOutgoing ? permission.target : permission.source),
                  );
                  const connectedAddress =
                    connectedNode?.fullAddress ?? connectedNode?.id ?? "";

                  return (
                    <AccordionItem
                      key={`${permission.source}-${permission.target}`}
                      value={`${permission.source}-${permission.target}`}
                      className="mt-4 border bg-accent"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-700/50 text-left">
                        <div className="flex flex-col gap-1 w-full pr-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">
                              {isOutgoing ? "← Granted " : "→ Received "}
                              Permission {details?.permission_id ?? ""}
                            </span>
                          </div>
                          <LinkButtons details={details} />
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
                            <ActionButtons
                              connectedAddress={connectedAddress}
                            />
                          </div>
                        </div>
                        {details && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Scope
                                </span>
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
                                    calculateTimeRemaining(
                                      new Date(details.createdAt ?? Date.now()),
                                      Number(details.duration),
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
                                  {details.permission_id}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Enforcement
                                </span>
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
            </div>
          </ScrollArea>
        ) : (
          <span className="text-gray-500 text-center mt-8">
            No permissions found for this agent
          </span>
        )}
      </Card>
    </div>
  );
}
