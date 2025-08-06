import { useCallback } from "react";

import type {
  DelegationTreeManager,
  PermissionId,
} from "@torus-network/sdk/chain";

import { cn } from "@torus-ts/ui/lib/utils";

import type { PermissionColorManager } from "./permission-colors";

interface UsePermissionBadgesProps {
  colorManager: PermissionColorManager | null;
  activePermission: PermissionId | "self" | null;
  treeManager: DelegationTreeManager | null;
}

export function usePermissionBadges({
  colorManager,
  activePermission,
  treeManager,
}: UsePermissionBadgesProps) {
  const renderPermissionBadges = useCallback(() => {
    if (!colorManager || !treeManager) return null;

    // Use treeManager to get all permission counts
    const allPermissions = new Set(treeManager.getAllPermissionCounts().keys());

    return Array.from(allPermissions).map((permissionId) => {
      const typedPermissionId = permissionId;
      const color = colorManager.getColorForPermission(typedPermissionId);
      const displayText =
        colorManager.getPermissionDisplayText(typedPermissionId);
      const isActive = activePermission === permissionId;

      return (
        <div
          key={permissionId}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono border",
            isActive
              ? `${color.bg} ${color.border} ${color.text} border-2 font-semibold`
              : "bg-muted/50 text-muted-foreground border-border",
          )}
        >
          <div
            className="w-3 h-3 border border-border/50 rounded-sm"
            style={{ backgroundColor: color.hex }}
          />
          <span className="font-semibold">{displayText}</span>
          {isActive && <span className="ml-1 text-xs">ACTIVE</span>}
        </div>
      );
    });
  }, [colorManager, activePermission, treeManager]);

  return renderPermissionBadges;
}
