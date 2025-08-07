import type { PermissionId } from "@torus-network/sdk/chain";
import { smallAddress } from "@torus-network/torus-utils/torus";

import { cn } from "@torus-ts/ui/lib/utils";

import { getPermissionClasses } from "../create-capability-flow-colors";
import { useDelegationTree } from "../create-capability-flow-hooks/use-delegation-tree";

interface PermissionBadgesPanelProps {
  activePermission: PermissionId | "self" | null;
}

export function PermissionBadgesPanel({
  activePermission,
}: PermissionBadgesPanelProps) {
  const { data: delegationData } = useDelegationTree();

  if (!delegationData?.treeManager) {
    return null;
  }

  const allPermissions = new Set(
    delegationData.treeManager.getAllPermissionCounts().keys(),
  );

  return (
    <div className="flex flex-wrap gap-1">
      {Array.from(allPermissions).map((permissionId) => {
        const classes = getPermissionClasses(permissionId);
        const isActive = activePermission === permissionId;
        const displayText = permissionId === "self" 
          ? "Your Paths" 
          : `0x${smallAddress(permissionId)}`;

        return (
          <div
            key={permissionId}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono border",
              isActive
                ? `${classes.selected} border-2 font-semibold`
                : "bg-muted/50 text-muted-foreground border-border",
            )}
          >
            <div
              className={cn(
                "w-3 h-3 border border-border/50 rounded-sm",
                classes.bg
              )}
            />
            <span className="font-semibold">{displayText}</span>
          </div>
        );
      })}
    </div>
  );
}
