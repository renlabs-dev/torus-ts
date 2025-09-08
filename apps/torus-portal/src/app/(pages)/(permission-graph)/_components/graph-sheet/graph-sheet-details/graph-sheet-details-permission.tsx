import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { Badge } from "@torus-ts/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";
import { Separator } from "@torus-ts/ui/components/separator";
import { AddressWithAgent } from "~/app/_components/address-with-agent";
import { useMultipleAccountEmissions } from "~/hooks/use-multiple-account-emissions";
import { calculateStreamValue } from "~/utils/calculate-stream-value";
import { ShortenedCapabilityPath } from "~/utils/capability-path";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Hash,
  Infinity as InfinityIcon,
  Key,
  Layers,
  Shield,
  User,
  UserCheck,
} from "lucide-react";
import { useMemo } from "react";
import type {
  allPermissions,
  CustomGraphNode,
} from "../../permission-graph-types";
import { formatDuration, formatScope } from "../../permission-graph-utils";

interface GraphSheetDetailsPermissionProps {
  selectedNode: CustomGraphNode;
  allPermissions?: allPermissions;
}

export function GraphSheetDetailsPermission({
  selectedNode,
  allPermissions,
}: GraphSheetDetailsPermissionProps) {
  const permissionData = selectedNode.permissionData;

  // Group distribution targets by target account to avoid duplicates and show streams per target
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const distributionTargets = useMemo(() => {
    if (
      !allPermissions ||
      !permissionData ||
      permissionData.permissionType !== "stream"
    ) {
      return [];
    }

    // targetAccountId -> (streamKey -> { streamId, weight })
    const grouped = new Map<
      string,
      Map<string, { streamId?: string | null; weight: number }>
    >();

    let totalWeight = 0;
    for (const p of allPermissions) {
      if (p.permissions.permissionId !== permissionData.permissionId) continue;
      const target = p.emission_distribution_targets;
      if (!target?.targetAccountId) continue;
      totalWeight += target.weight;
      const targetId = target.targetAccountId;
      const streamKey = target.streamId ?? "default";
      if (!grouped.has(targetId)) grouped.set(targetId, new Map());
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const streams = grouped.get(targetId)!;
      if (!streams.has(streamKey)) {
        streams.set(streamKey, {
          streamId: target.streamId,
          weight: target.weight,
        });
      }
    }

    return Array.from(grouped.entries()).map(([targetAccountId, streams]) => {
      const values = Array.from(streams.values());
      const hasSpecificStreams = values.some((s) => s.streamId);
      // If there are specific streams, drop the default aggregate to avoid duplicated weights
      if (hasSpecificStreams && streams.has("default")) {
        streams.delete("default");
      }
      return {
        targetAccountId,
        streams: Array.from(streams.values()),
        totalWeight, // Add total weight for normalization
      };
    });
  }, [allPermissions, permissionData]);

  // Get emission data for all target accounts and the delegator
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const allAccountIds = useMemo(() => {
    const accounts = new Set<string>();

    // Add delegator account
    if (permissionData?.delegatorAccountId) {
      accounts.add(permissionData.delegatorAccountId);
    }

    // Add all distribution target accounts
    distributionTargets.forEach((target) => {
      accounts.add(target.targetAccountId);
    });

    return Array.from(accounts);
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [permissionData, distributionTargets]);

  const emissionsData = useMultipleAccountEmissions({
    accountIds: allAccountIds,
  });

  if (!permissionData) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No permission data available</p>
        </CardContent>
      </Card>
    );
  }

  // Find the detailed permission data from the API
  const detailedPermission = allPermissions?.find(
    (p) => p.permissions.permissionId === permissionData.permissionId,
  );

  const isIndefinite =
    detailedPermission?.permissions.durationType === "indefinite";
  const remainingBlocks = Number(
    detailedPermission?.permissions.durationBlockNumber ?? 0,
  );

  return (
    <div className="w-full space-y-4 pb-8">
      {/* Main Permission Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              AGENT Permission
            </CardTitle>
            <Badge
              variant={
                permissionData.permissionType === "stream"
                  ? "default"
                  : "secondary"
              }
              className="flex items-center gap-1"
            >
              <Layers className="h-3 w-3" />
              {formatScope(permissionData.permissionType)}
            </Badge>
          </div>
          <CardDescription>
            Permission ID: {smallAddress(permissionData.permissionId)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Hash className="h-4 w-4" />
                Permission ID
              </h4>
              <p className="text-muted-foreground break-all font-mono text-sm">
                {permissionData.permissionId}
              </p>
            </div>
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                <Key className="h-4 w-4" />
                Scope
              </h4>
              <p className="text-muted-foreground text-sm">
                {permissionData.scope}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="mb-2 flex items-center gap-2 font-medium">
                {isIndefinite ? (
                  <InfinityIcon className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                Duration
              </h4>
              <div className="flex items-center gap-2">
                {isIndefinite ? (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Indefinite
                  </Badge>
                ) : (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        remainingBlocks > 0 ? "secondary" : "destructive"
                      }
                      className="flex items-center gap-1"
                    >
                      {remainingBlocks > 0 ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                      {formatDuration(remainingBlocks, isIndefinite)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            {permissionData.permissionType === "stream" && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  Executions
                </h4>
                <p className="text-muted-foreground text-sm">
                  {detailedPermission?.permissions.executionCount ?? 0} times
                </p>
              </div>
            )}
          </div>

          {detailedPermission?.permissions.createdAt && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Created{" "}
              {new Date(
                detailedPermission.permissions.createdAt,
              ).toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grantor Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Delegator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AddressWithAgent
            address={permissionData.delegatorAccountId}
            className="mb-2"
          />
          <p className="text-muted-foreground text-xs">
            Account that delegated this permission
          </p>
        </CardContent>
      </Card>

      {permissionData.permissionType !== "stream" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Recipient
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddressWithAgent
              address={permissionData.recipientAccountId}
              className="mb-2"
            />
            <p className="text-muted-foreground text-xs">
              Account that received this permission
            </p>
          </CardContent>
        </Card>
      )}

      {/* Distribution Targets (for stream permissions) */}
      {permissionData.permissionType === "stream" &&
        distributionTargets.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Distribution Target{distributionTargets.length > 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {distributionTargets.map((entry, i) => (
                  <div key={entry.targetAccountId} className="w-full">
                    <div className="flex flex-col items-start justify-between">
                      <AddressWithAgent
                        address={entry.targetAccountId}
                        className="mb-2"
                      />
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {entry.streams.map((s, idx) => (
                            <span
                              key={`${entry.targetAccountId}-${s.streamId ?? "default"}-${idx}`}
                              className="flex items-center gap-1"
                            >
                              {s.streamId && (
                                <Badge variant="secondary">
                                  Stream: {smallAddress(s.streamId, 4)}
                                </Badge>
                              )}
                              <Badge variant="secondary">
                                Weight: {s.weight}
                              </Badge>
                              <Badge variant="secondary">
                                {(() => {
                                  // Find the stream allocation percentage for this permission
                                  const streamAllocation =
                                    allPermissions?.find(
                                      (p) =>
                                        p.permissions.permissionId ===
                                        permissionData.permissionId,
                                    )?.emission_stream_allocations
                                      ?.percentage || 0;

                                  // Calculate normalized weight percentage
                                  const normalizedWeightPercentage =
                                    entry.totalWeight > 0
                                      ? (entry.streams.reduce(
                                          (total, s) => total + s.weight,
                                          0,
                                        ) /
                                          entry.totalWeight) *
                                        streamAllocation
                                      : 0;

                                  return calculateStreamValue(
                                    normalizedWeightPercentage,
                                    emissionsData[
                                      permissionData.delegatorAccountId
                                    ],
                                    true,
                                    permissionData.delegatorAccountId,
                                  );
                                })()}
                              </Badge>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {i < distributionTargets.length - 1 && (
                      <Separator className="my-3" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Stream Allocation (for stream permissions) */}
      {permissionData.permissionType === "stream" &&
        detailedPermission?.emission_stream_allocations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Stream Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col">
                <div className="flex gap-2">
                  <h4 className="text-muted-foreground mb-2 font-medium">
                    Stream ID:
                  </h4>
                  <p>
                    {smallAddress(
                      detailedPermission.emission_stream_allocations.streamId,
                      14,
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <h4 className="text-muted-foreground mb-2 font-medium">
                    Allocated Percentage:
                  </h4>
                  <p>
                    {detailedPermission.emission_stream_allocations.percentage.toFixed(
                      2,
                    )}
                    %
                  </p>
                </div>
                <div className="flex gap-2">
                  <h4 className="text-muted-foreground mb-2 font-medium">
                    Amount:
                  </h4>
                  <p className="text-green-500">
                    {calculateStreamValue(
                      detailedPermission.emission_stream_allocations.percentage,
                      emissionsData[permissionData.delegatorAccountId],
                      true,
                      permissionData.delegatorAccountId,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Capability Paths (for capability permissions) */}
      {permissionData.permissionType === "capability" &&
        (() => {
          // Extract all capability paths from ALL database entries with the same permission_id
          // The database stores multiple entries with the same permission_id but different paths
          const allPermissionEntries =
            allPermissions?.filter(
              (p) => p.permissions.permissionId === permissionData.permissionId,
            ) ?? [];

          // Collect all unique paths from all entries
          const allPaths = new Set<string>();
          for (const entry of allPermissionEntries) {
            if (entry.namespace_permission_paths?.namespacePath) {
              // Each entry has one path, collect them all
              allPaths.add(entry.namespace_permission_paths.namespacePath);
            }
          }

          const paths = Array.from(allPaths);

          if (paths.length === 0) {
            return null;
          }

          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Capability Path{paths.length > 1 ? "s" : ""}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {paths.map((path, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-sm">
                        <ShortenedCapabilityPath
                          path={path}
                          showTooltip={true}
                        />
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })()}
    </div>
  );
}
