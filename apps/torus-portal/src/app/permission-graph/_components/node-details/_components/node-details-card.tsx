"use client";

import { Card } from "@torus-ts/ui/components/card";
import { api } from "~/trpc/react";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@torus-ts/ui/components/accordion";
import type { CustomGraphData, CustomGraphNode } from "../../permission-graph-utils";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { 
  AddressCopyButton,
  AddressLinkButton,
  AddressGoButton,
  formatScope,
  formatDuration,
  getNodePermissions,
  sortPermissions,
 } from "../../permission-graph-utils";
import { trySync } from "@torus-network/torus-utils/try-catch";
import { PermissionNodeAgentCard } from "./agent-card";
import { UtilityButtonsDescription } from "./utility-buttons-description"

interface PermissionNodeDetailsProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  onBackgroundClick?: () => void;
}



export function NodeDetailsCard({ 
  selectedNode, 
  graphData,
  // TODO : When click on the background, it should close the details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBackgroundClick 
}: PermissionNodeDetailsProps) {

  const [detailsError, detailsSuccess] = trySync(() => api.permissionDetails.all.useQuery());
  if (detailsError !== undefined) {
    console.log("Error fetching permission details: ", detailsError);
  }
  const {data : permissionDetails } = detailsSuccess ?? { data: [] };

  if (!graphData) return null;

  // Get and sort permissions for this node
  const nodePermissions = getNodePermissions(selectedNode, graphData);
  const sortedPermissions = sortPermissions(nodePermissions, permissionDetails ?? []);

  // Calculate time remaining for permissions
  const calculateTimeRemaining = (createdAt: Date, duration: number ): number => {
    const endDate = new Date(createdAt.getTime() + (duration * 24 * 60 * 60 * 1000));
    const timeRemainingMs = endDate.getTime() - new Date().getTime();
    const daysRemaining = Math.ceil(timeRemainingMs / (24 * 60 * 60 * 1000));
    return daysRemaining;
  };

  return (
    <div className="flex flex-col gap-4 h-full w-[27em] z-50">
      <PermissionNodeAgentCard 
        nodeId={selectedNode.id}
        fullAddress={selectedNode.fullAddress}
      />

      <Card className="w-[27em] flex-1 p-4 flex flex-col overflow-hidden z-50">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Applied Permissions</h2>
        
        {sortedPermissions.length > 0 ? (
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex max-h-96 overflow-auto">
              <Accordion type="single" collapsible className="w-full">
              {sortedPermissions.map((permission, index) => {
                const details = permissionDetails?.find(
                  p => p.grantor_key === permission.source && p.grantee_key === permission.target
                );
                const isOutgoing = permission.type === 'outgoing';
                const connectedNode = graphData.nodes.find(
                  n => n.id === (isOutgoing ? permission.target : permission.source)
                );
                const connectedAddress = connectedNode?.fullAddress ?? connectedNode?.id ?? '';
                const selectedAddress = selectedNode.fullAddress ?? '';

                
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
                            Permission {details?.permission_id ?? index + 1}
                          </span>
                        </div>
                        <UtilityButtonsDescription details={details} />
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                    <div className="flex flex-col gap-1 space-between">
                      <div className="flex items-center gap-2 text-gray-400 font-mono">
                        <div className="flex flex-row gap-2">
                          <span className="text-xs text-gray-500  ">
                            {isOutgoing ? 'Granted To' : 'Received From'} 
                          </span>
                        </div>
                      <AddressCopyButton link={connectedAddress}/> <AddressLinkButton link={connectedAddress}/> <AddressGoButton link={selectedAddress}/>
                      </div>
                        <span>{smallAddress(connectedAddress, 14)}</span>
                    </div>
                        {details && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-gray-500">Scope</span>
                                <div className="text-sm text-gray-300">{formatScope(details.scope)}</div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Expires in</span>
                                <div className="text-sm text-gray-300">{formatDuration(calculateTimeRemaining(details.createdAt, details.duration))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-xs text-gray-500">Executions</span>
                                <div className="text-sm text-gray-300">{details.execution_count}</div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">Permission ID</span>
                                <div className="text-sm text-gray-300">{details.permission_id}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-xs text-gray-500">Enforcement</span>
                                <div className=" font-mono text-gray-300 break-all">
                                  {details.enforcement}
                                </div>
                              </div>
                              
                              {details.parent_id && (
                                <div>
                                  <span className="text-xs text-gray-500">Parent ID</span>
                                  <div className="text-sm text-gray-300">{details.parent_id}</div>
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