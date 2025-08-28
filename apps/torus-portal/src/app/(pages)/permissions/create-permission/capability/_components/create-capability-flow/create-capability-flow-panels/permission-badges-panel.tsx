import type { PermissionId } from "@torus-network/sdk/chain";
import { smallAddress } from "@torus-network/torus-utils/torus";
import { cn } from "@torus-ts/ui/lib/utils";
import type { Node } from "@xyflow/react";
import { getPermissionClasses } from "../create-capability-flow-colors";
import { useDelegationTree } from "../create-capability-flow-hooks/use-delegation-tree";
import type { NamespacePathNodeData } from "../create-capability-flow-types";

interface PermissionBadgesPanelProps {
  activePermission: PermissionId | "self" | null;
  nodes: Node<NamespacePathNodeData>[];
}

export function PermissionBadgesPanel({
  activePermission,
  nodes,
}: PermissionBadgesPanelProps) {
  const { data: delegationData } = useDelegationTree();

  if (!delegationData?.treeManager) {
    return null;
  }

  const allPermissions = new Set(
    delegationData.treeManager.getAllPermissionCounts().keys(),
  );

  // Get all permissions that are currently selected on any path
  const selectedPermissions = new Set(
    nodes
      .filter((node) => node.data.selectedPermission !== null)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      .map((node) => node.data.selectedPermission!),
  );

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(allPermissions).map((permissionId) => {
        const classes = getPermissionClasses(permissionId);
        const isActive = activePermission === permissionId;
        const isSelected = selectedPermissions.has(permissionId);
        const displayText =
          permissionId === "self"
            ? "Your Paths"
            : `0x${smallAddress(permissionId)}`;

        return (
          <div
            key={permissionId}
            className={cn(
              `flex items-center gap-1 rounded-sm border px-2 py-1 font-mono text-xs backdrop-blur-sm`,
              isActive
                ? `${classes.selected} font-semibold`
                : isSelected
                  ? `${classes.selected} font-semibold`
                  : "bg-muted/50 text-muted-foreground border-border",
            )}
          >
            <div
              className={cn(
                "border-border/50 h-3 w-3 rounded-sm border",
                classes.bg,
              )}
            />
            <span className="font-semibold">{displayText}</span>
          </div>
        );
      })}
    </div>
  );
}
