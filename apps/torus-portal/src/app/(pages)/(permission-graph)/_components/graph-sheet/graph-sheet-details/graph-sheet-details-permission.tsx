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

import { smallAddress } from "@torus-network/torus-utils/subspace";

import { Badge } from "@torus-ts/ui/components/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@torus-ts/ui/components/card";

import type {
  CustomGraphNode,
  PermissionDetails,
} from "../../permission-graph-types";
import { formatDuration, formatScope } from "../../permission-graph-utils";

interface PermissionDetailsProps {
  selectedNode: CustomGraphNode;
  permissionDetails?: PermissionDetails;
}

export function GraphSheetDetailsPermission({
  selectedNode,
  permissionDetails,
}: PermissionDetailsProps) {
  const permissionData = selectedNode.permissionData;

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
  const detailedPermission = permissionDetails?.find(
    (p) => p.permissions.permissionId === permissionData.permissionId,
  );

  const isIndefinite =
    detailedPermission?.permissions.durationType === "indefinite";
  const remainingBlocks = detailedPermission?.remainingBlocks ?? 0;

  return (
    <div className="w-full space-y-6 py-8">
      {/* Main Permission Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {permissionData.permissionType.toUpperCase()} Permission
            </CardTitle>
            <Badge
              variant={
                permissionData.permissionType === "emission"
                  ? "default"
                  : "secondary"
              }
              className="flex items-center gap-1"
            >
              <Layers className="w-3 h-3" />
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
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Permission ID
              </h4>
              <p className="text-sm text-muted-foreground font-mono break-all">
                {permissionData.permissionId}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Scope
              </h4>
              <p className="text-sm text-muted-foreground">
                {permissionData.scope}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                {isIndefinite ? (
                  <InfinityIcon className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
                Duration
              </h4>
              <div className="flex items-center gap-2">
                {isIndefinite ? (
                  <Badge
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="w-3 h-3 text-green-500" />
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
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                      {formatDuration(remainingBlocks)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Executions
              </h4>
              <p className="text-sm text-muted-foreground">
                {detailedPermission?.permissions.executionCount ?? 0} times
              </p>
            </div>
          </div>

          {detailedPermission?.permissions.createdAt && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
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
            <User className="w-5 h-5" />
            Permission Grantor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm">
                {smallAddress(permissionData.grantorAccountId)}
              </p>
              <p className="text-xs text-muted-foreground">
                Account that granted this permission
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grantee Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Permission Grantee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-sm">
                {smallAddress(permissionData.granteeAccountId)}
              </p>
              <p className="text-xs text-muted-foreground">
                Account that received this permission
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribution Targets (for emission permissions) */}
      {permissionData.permissionType === "emission" &&
        detailedPermission?.emission_distribution_targets && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Distribution Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm">
                      {smallAddress(
                        detailedPermission.emission_distribution_targets
                          .targetAccountId,
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Target account for emission distribution
                    </p>
                  </div>
                  <Badge variant="secondary">
                    Weight:{" "}
                    {detailedPermission.emission_distribution_targets.weight}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Stream Allocation (for emission permissions) */}
      {permissionData.permissionType === "emission" &&
        detailedPermission?.emission_stream_allocations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Stream Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Stream ID</h4>
                  <Badge variant="secondary">
                    {smallAddress(
                      detailedPermission.emission_stream_allocations.streamId,
                    )}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Percentage</h4>
                  <p className="text-sm text-muted-foreground">
                    {detailedPermission.emission_stream_allocations.percentage.toFixed(
                      2,
                    )}
                    %
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
