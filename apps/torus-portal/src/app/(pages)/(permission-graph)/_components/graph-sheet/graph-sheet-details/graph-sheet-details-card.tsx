import { smallAddress } from "@torus-network/torus-utils/torus/address";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@torus-ts/ui/components/accordion";
import { Card } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { ScrollArea } from "@torus-ts/ui/components/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { ShortenedCapabilityPath } from "~/utils/capability-path";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import type {
  allPermissions,
  CustomGraphData,
  CustomGraphLinkWithType,
  CustomGraphNode,
} from "../../permission-graph-types";
import { formatDuration, formatScope } from "../../permission-graph-utils";
import { GraphSheetDetailsLinkButtons } from "./graph-sheet-details-link-buttons";
import { GraphSheetDetailsSignalsAccordion } from "./graph-sheet-details-signals-accordion";

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
  const pathname = usePathname();

  // Helper function to get correct parameter name based on current page
  const getNodeParam = (nodeId: string) => {
    const paramName = pathname.includes("/2d-hypergraph") ? "agent" : "id";
    return `?${paramName}=${nodeId}`;
  };

  // Helper function to extract recipients based on permission type
  const extractRecipients = (
    details: NonNullable<allPermissions>[number] | undefined,
  ): string[] | string | null => {
    if (!details) return null;

    // For stream (emission) permissions, collect all recipients from distribution targets
    if (details.emission_permissions && details.emission_distribution_targets) {
      const targets = Array.isArray(details.emission_distribution_targets)
        ? details.emission_distribution_targets
        : [details.emission_distribution_targets];

      const recipients = targets
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        .map((target) => target?.targetAccountId as string | undefined)
        .filter((id): id is string => Boolean(id));

      return recipients.length > 0 ? recipients : null;
    }

    // For namespace (capability) permissions, use single recipient
    if (details.namespace_permissions) {
      return details.permissions.granteeAccountId || null;
    }

    // Fallback to granteeAccountId for other permission types
    return details.permissions.granteeAccountId || null;
  };

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
    const connectedNode = graphData?.nodes.find(
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

  // Group and sort permissions
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const groupedPermissions = useMemo(() => {
    const delegated = processedPermissions.filter((p) => p.isOutgoing);
    const received = processedPermissions.filter((p) => !p.isOutgoing);

    const sortPermissions = (permissions: typeof processedPermissions) => {
      return permissions.sort((a, b) => {
        // Sort by type: Capabilities first (namespace_permissions), then Emissions
        const aIsCapability = !!a.details?.namespace_permissions;
        const bIsCapability = !!b.details?.namespace_permissions;

        if (aIsCapability && !bIsCapability) return -1;
        if (!aIsCapability && bIsCapability) return 1;

        // Within same type, sort alphabetically by permission ID
        const aId = a.details?.permissions.permissionId ?? "";
        const bId = b.details?.permissions.permissionId ?? "";
        return aId.localeCompare(bId);
      });
    };

    return {
      delegated: sortPermissions(delegated),
      received: sortPermissions(received),
    };
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [processedPermissions]);

  const renderPermissionGroup = (
    permissions: typeof processedPermissions,
    title: string,
    icon: React.ReactNode,
  ) => (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2 px-2">
        {icon}
        <h3 className="font-semibold text-white">{title}</h3>
        <span className="text-muted-foreground text-sm">
          ({permissions.length})
        </span>
      </div>
      {permissions.length > 0 ? (
        <div className="space-y-2">
          {/* Capabilities section */}
          {permissions.some((p) => p.details?.namespace_permissions) && (
            <div className="mb-4">
              <div className="mb-2 px-2 text-sm text-gray-400">
                Capabilities
              </div>
              <div className="border-l-2 border-blue-500/30 pl-2">
                {permissions
                  .filter((p) => p.details?.namespace_permissions)
                  .map(({ details, sourceId, targetId }) => (
                    <AccordionItem
                      key={`${sourceId}-${targetId}`}
                      value={`${sourceId}-${targetId}`}
                      className="bg-accent mb-2 border"
                    >
                      <AccordionTrigger className="px-4 py-3 text-left hover:bg-gray-700/50 hover:no-underline">
                        <div className="flex w-full flex-col gap-1 pr-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">
                              {details?.namespace_permissions
                                ? "Capability permission"
                                : "Permission"}
                            </span>
                          </div>
                          <GraphSheetDetailsLinkButtons
                            grantor_key={details?.permissions.grantorAccountId}
                            recipients={extractRecipients(details)}
                            permission_id={String(
                              details?.permissions.permissionId,
                            )}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 px-4 pb-4 pt-2">
                        {details && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Scope
                                </span>
                                <div className="text-sm text-gray-300">
                                  {formatScope("capability")}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">
                                  {details.permissions.durationType ===
                                  "indefinite"
                                    ? "Duration"
                                    : "Expires in"}
                                </span>
                                <div className="text-sm text-gray-300">
                                  {formatDuration(
                                    Number(
                                      details.permissions.durationBlockNumber ??
                                        0,
                                    ),
                                    details.permissions.durationType ===
                                      "indefinite",
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Permission ID
                                </span>
                                <button
                                  onClick={() => {
                                    router.push(
                                      getNodeParam(
                                        `permission-${details.permissions.permissionId}`,
                                      ),
                                    );
                                  }}
                                  className="cursor-pointer text-sm text-blue-400 underline hover:text-blue-300"
                                >
                                  {smallAddress(
                                    String(details.permissions.permissionId),
                                  )}
                                </button>
                              </div>
                            </div>

                            {details.namespace_permissions &&
                              (() => {
                                // Get all capability paths from all database entries with the same permission_id
                                const allPermissionEntries =
                                  allPermissions?.filter(
                                    (p) =>
                                      p.permissions.permissionId ===
                                      details.permissions.permissionId,
                                  ) ?? [];

                                const allPaths = new Set<string>();
                                for (const entry of allPermissionEntries) {
                                  if (
                                    entry.namespace_permission_paths
                                      ?.namespacePath
                                  ) {
                                    allPaths.add(
                                      entry.namespace_permission_paths
                                        .namespacePath,
                                    );
                                  }
                                }

                                const paths = Array.from(allPaths);

                                if (paths.length === 0) {
                                  return null;
                                }

                                return (
                                  <div>
                                    <span className="text-xs text-gray-500">
                                      Capability path
                                      {paths.length > 1 ? "s" : ""}
                                    </span>
                                    <div className="space-y-1 break-all font-mono text-sm text-gray-300">
                                      {paths.map((path, index) => (
                                        <div key={index}>
                                          <ShortenedCapabilityPath
                                            path={path}
                                            showTooltip={true}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })()}
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </div>
            </div>
          )}

          {/* Stream section */}
          {permissions.some((p) => p.details?.emission_permissions) && (
            <div>
              <div className="mb-2 px-2 text-sm text-gray-400">Streams</div>
              <div className="border-l-2 border-green-500/30 pl-2">
                {permissions
                  .filter((p) => p.details?.emission_permissions)
                  .map(({ details, sourceId, targetId }) => (
                    <AccordionItem
                      key={`${sourceId}-${targetId}`}
                      value={`${sourceId}-${targetId}`}
                      className="bg-accent mb-2 border"
                    >
                      <AccordionTrigger className="px-4 py-3 text-left hover:bg-gray-700/50 hover:no-underline">
                        <div className="flex w-full flex-col gap-1 pr-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-white">
                              {details?.emission_permissions
                                ? "Stream permission"
                                : "Permission"}
                            </span>
                          </div>
                          <GraphSheetDetailsLinkButtons
                            grantor_key={details?.permissions.grantorAccountId}
                            recipients={extractRecipients(details)}
                            permission_id={String(
                              details?.permissions.permissionId,
                            )}
                          />
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 px-4 pb-4 pt-2">
                        {details && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-gray-500">
                                  Scope
                                </span>
                                <div className="text-sm text-gray-300">
                                  {formatScope("emission")}
                                </div>
                              </div>
                              <div>
                                <span className="text-xs text-gray-500">
                                  {details.permissions.durationType ===
                                  "indefinite"
                                    ? "Duration"
                                    : "Expires in"}
                                </span>
                                <div className="text-sm text-gray-300">
                                  {formatDuration(
                                    Number(
                                      details.permissions.durationBlockNumber ??
                                        0,
                                    ),
                                    details.permissions.durationType ===
                                      "indefinite",
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
                                      getNodeParam(
                                        `permission-${details.permissions.permissionId}`,
                                      ),
                                    );
                                  }}
                                  className="cursor-pointer text-sm text-blue-400 underline hover:text-blue-300"
                                >
                                  {smallAddress(
                                    String(details.permissions.permissionId),
                                  )}
                                </button>
                              </div>
                              {details.emission_stream_allocations && (
                                <div className="col-span-2">
                                  <span className="text-xs text-gray-500">
                                    Emission ID
                                  </span>
                                  <div className="text-sm text-gray-300">
                                    <CopyButton
                                      copy={String(
                                        details.emission_stream_allocations
                                          .streamId,
                                      )}
                                      message="Emission ID copied to clipboard"
                                      variant="ghost"
                                      className="h-auto p-0"
                                    >
                                      <span className="cursor-pointer text-blue-400 underline hover:text-blue-300">
                                        {smallAddress(
                                          String(
                                            details.emission_stream_allocations
                                              .streamId,
                                          ),
                                        )}
                                      </span>
                                    </CopyButton>
                                  </div>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );

  const PermissionsContent = () => (
    <ScrollArea className="h-[calc(100vh-26rem)]">
      {processedPermissions.length > 0 ? (
        <Accordion type="single" collapsible className="w-full">
          {/* Delegated Permissions - only show if there are delegated permissions */}
          {groupedPermissions.delegated.length > 0 &&
            renderPermissionGroup(
              groupedPermissions.delegated,
              "Delegated",
              <ArrowUpRight className="text-muted-foreground h-4 w-4" />,
            )}

          {/* Received Permissions - only show if there are received permissions */}
          {groupedPermissions.received.length > 0 &&
            renderPermissionGroup(
              groupedPermissions.received,
              "Received",
              <ArrowDownLeft className="text-muted-foreground h-4 w-4" />,
            )}
        </Accordion>
      ) : (
        <div className="mt-8 text-center text-gray-500">
          No permissions found for this agent
        </div>
      )}
    </ScrollArea>
  );

  if (!graphData) return null;

  return (
    <Card className="z-50 flex w-full flex-1 flex-col border-none">
      <Tabs defaultValue="permissions" className="flex w-full flex-1 flex-col">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="signals">Signals</TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="mt-0 flex-1">
          {/* eslint-disable-next-line react-hooks/static-components */}
          <PermissionsContent />
        </TabsContent>

        <TabsContent value="signals" className="mt-0 flex-1">
          <ScrollArea className="h-[calc(100vh-32rem)] pb-4 md:pb-0">
            <GraphSheetDetailsSignalsAccordion selectedNode={selectedNode} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
