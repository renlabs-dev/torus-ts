// import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { smallAddress } from "@torus-network/torus-utils/torus/address";

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
  CustomGraphData,
  CustomGraphLinkWithType,
  CustomGraphNode,
} from "../../permission-graph-types";
import { formatDuration, formatScope } from "../../permission-graph-utils";
import { GraphSheetDetailsLinkButtons } from "./graph-sheet-details-link-buttons";
import { GraphSheetDetailsSignalsAccordion } from "./graph-sheet-details-signals-accordion";

// Every single namespace name has been changed to Capability Permission
// as requested here: https://coda.io/d/RENLABS-CORE-DEVELOPMENT-DOCUMENTS_d5Vgr5OavNK/Text-change-requests_su4jQAlx
// In the future we are going to have all the other names from namespace to Capability Permission
// TODO : Change all namespace to Capability Permission

interface NodeDetailsCardProps {
  nodePermissions: CustomGraphLinkWithType[];
  selectedNode?: CustomGraphNode;
  graphData: CustomGraphData | null;
  allPermissions?: allPermissions;
}

export function NodeDetailsCard({
  graphData,
  nodePermissions,
  allPermissions,
  selectedNode,
}: NodeDetailsCardProps) {
  const router = useRouter();
  
  if (!graphData) return null;

  const processedPermissions = nodePermissions.map((permission) => {
    // Extract permission ID from node ID if it's a permission node
    const getPermissionId = (nodeId: string | number | object | undefined) => {
      if (!nodeId) return null;
      const id =
        typeof nodeId === "object" && "id" in nodeId ? nodeId.id : nodeId;
      if (typeof id !== "string") return null;
      return id.startsWith("permission-")
        ? id.replace("permission-", "")
        : null;
    };

    const sourcePermissionId = getPermissionId(permission.source);
    const targetPermissionId = getPermissionId(permission.target);

    // Try to find by permission ID first (most reliable)
    const permissionId = sourcePermissionId ?? targetPermissionId;

    const details = allPermissions?.find((p) => {
      if (permissionId) {
        return p.permissions.permissionId === permissionId;
      }
      // Fallback to account ID matching (for non-permission nodes)
      const sourceId =
        typeof permission.source === "object" && "id" in permission.source
          ? permission.source.id
          : permission.source;
      const targetId =
        typeof permission.target === "object" && "id" in permission.target
          ? permission.target.id
          : permission.target;
      return (
        p.permissions.grantorAccountId === sourceId &&
        p.permissions.granteeAccountId === targetId
      );
    });
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
            ({ details, isOutgoing, sourceId, targetId }) => (
              <AccordionItem
                key={`${sourceId}-${targetId}`}
                value={`${sourceId}-${targetId}`}
                className="border bg-accent mb-2"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-700/50 text-left">
                  <div className="flex flex-col gap-1 w-full pr-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-white">
                        {isOutgoing ? "← Delegated " : "→ Received "}
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
                            ? "CAPABILITY"
                            : "UNKNOWN"
                      }
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 space-y-3">
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
                                  ? "capability"
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
                              details.permissions.durationType === "indefinite",
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
                          <button
                            onClick={() => {
                              router.push(
                                `?id=permission-${details.permissions.permissionId}`,
                              );
                            }}
                            className="text-sm text-blue-400 hover:text-blue-300 cursor-pointer underline"
                          >
                            {smallAddress(
                              String(details.permissions.permissionId),
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ),
          )}
        </Accordion>
      ) : (
        <div className="text-gray-500 text-center mt-8">
          No permissions found for this agent
        </div>
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
