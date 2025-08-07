import { useCallback } from "react";

import type {
  DelegationTreeManager,
  PermissionId,
} from "@torus-network/sdk/chain";

import { cn } from "@torus-ts/ui/lib/utils";

import {
  getPermissionColor,
  getPermissionDisplayText,
} from "../permission-colors";

interface UsePermissionBadgesProps {
  activePermission: PermissionId | "self" | null;
  treeManager: DelegationTreeManager | null;
}

export function usePermissionBadges({
  activePermission,
  treeManager,
}: UsePermissionBadgesProps) {
  const renderPermissionBadges = useCallback(() => {
    if (!treeManager) return null;

    // Use treeManager to get all permission counts
    const allPermissions = new Set(treeManager.getAllPermissionCounts().keys());

    return Array.from(allPermissions).map((permissionId) => {
      const typedPermissionId = permissionId;
      const colorName = getPermissionColor(typedPermissionId);
      const displayText = getPermissionDisplayText(typedPermissionId);
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
    });
  }, [activePermission, treeManager]);

  return renderPermissionBadges;
}
