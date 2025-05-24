import { Card } from "@torus-ts/ui/components/card";
import { PortalAgentItem } from "../../_components/agent-card";
import { api } from "~/trpc/react";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@torus-ts/ui/components/accordion";
import type { CustomGraphData, CustomGraphNode } from "./permission-graph-utils";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { formatScope, formatDuration, getNodePermissions, sortPermissions } from "./permission-graph-utils";

interface PermissionNodeDetailsProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  onBackgroundClick?: () => void;
}

export function PermissionNodeDetails({ 
  selectedNode, 
  graphData,
  // TODO : When click on the background, it should close the details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBackgroundClick 
}: PermissionNodeDetailsProps) {
  const { data: permissionDetails } = api.permission.details.all.useQuery();

  if (!graphData) return null;

  // Get and sort permissions for this node
  const nodePermissions = getNodePermissions(selectedNode, graphData);
  const sortedPermissions = sortPermissions(nodePermissions, permissionDetails ?? []);

  return (
    <div className="flex flex-col gap-4 h-full w-max">
      <Card className="flex-1 p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-4">Agent Details</h2>
        <PortalAgentItem
          agentKey={selectedNode.fullAddress ?? selectedNode.id}
          iconUrl={null}
          socialsList={{ discord: "", github: "", telegram: "", twitter: "", website: "" }}
          title={selectedNode.name}
          currentBlock={300}
        />
      </Card>

      <Card className="flex-1 p-4 flex flex-col overflow-hidden">
        <h2 className="text-lg font-semibold mb-4 flex-shrink-0">Applied Permissions</h2>
        
        {sortedPermissions.length > 0 ? (
          <ScrollArea className="flex-1 overflow-auto">
            <Accordion type="single" collapsible className="space-y-2 pr-3">
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
                    className="border border-gray-700 rounded-lg bg-gray-800/50"
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-700/50 text-left">
                      <div className="flex flex-col gap-1 w-full pr-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-white">
                            Permission {details?.permission_id ?? index + 1}
                          </span>
                          <span className="text-xs uppercase text-gray-400">
                            {details?.scope ?? 'EMISSION'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 font-mono">
                          <span>{smallAddress(connectedAddress, 2)}</span>
                          <span>{smallAddress(selectedAddress, 2)}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
                      <div>
                        <span className="text-xs text-gray-500">
                          {isOutgoing ? 'Granted To' : 'Received From'}
                        </span>
                        <div className="text-sm font-mono text-gray-300 break-all">
                          {connectedAddress}
                        </div>
                      </div>
                      
                      {details && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-xs text-gray-500">Scope</span>
                              <div className="text-sm text-gray-300">{formatScope(details.scope)}</div>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Duration</span>
                              <div className="text-sm text-gray-300">{formatDuration(details.duration)}</div>
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
                          
                          <div>
                            <span className="text-xs text-gray-500">Enforcement</span>
                            <div className="text-xs font-mono text-gray-300 break-all">
                              {details.enforcement}
                            </div>
                          </div>
                          
                          {details.parent_id && (
                            <div>
                              <span className="text-xs text-gray-500">Parent ID</span>
                              <div className="text-sm text-gray-300">{details.parent_id}</div>
                            </div>
                          )}
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
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