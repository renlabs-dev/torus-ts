import type { PermissionId } from "@torus-network/sdk/chain";

import { cn } from "@torus-ts/ui/lib/utils";

import { useDelegationTree } from "../create-capability-flow-hooks/use-delegation-tree";
import {
  getPermissionColor,
  getPermissionDisplayText,
} from "../permission-colors";

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
        const colorName = getPermissionColor(permissionId);
        const displayText = getPermissionDisplayText(permissionId);
        const isActive = activePermission === permissionId;

        return (
          <div
            key={permissionId}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono border",
              isActive
                ? `bg-${colorName}-500/10 border-${colorName}-500 text-${colorName}-500 border-2
                  font-semibold`
                : "bg-muted/50 text-muted-foreground border-border",
            )}
          >
            <div
              className={`w-3 h-3 border border-border/50 rounded-sm bg-${colorName}-500`}
            />
            <span className="font-semibold">{displayText}</span>
          </div>
        );
      })}
    </div>
  );
}
