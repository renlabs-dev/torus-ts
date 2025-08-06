import { memo } from "react";

import { Handle, Position } from "@xyflow/react";

import type { PermissionId } from "@torus-network/sdk/chain";

import { cn } from "@torus-ts/ui/lib/utils";

import { NODE_STYLES, OPACITY, PERMISSION_BUTTON_STYLES } from "./constants";
import type { NamespacePathNodeProps } from "./types";

export const NamespacePathNode = memo(function NamespacePathNode({
  data,
  onPermissionSelect,
}: NamespacePathNodeProps) {
  const isAccessible = data.accessible;
  const hasSelectedPermission = data.selectedPermission !== null;
  const handlePermissionButtonClick = (
    e: React.MouseEvent,
    permissionId: PermissionId | "self",
  ) => {
    e.stopPropagation();
    if (onPermissionSelect) {
      const nodeId = e.currentTarget.getAttribute("data-node-id");
      if (!nodeId) return;
      const isCurrentlySelected = data.selectedPermission === permissionId;

      // If clicking the same permission, deselect it
      onPermissionSelect(nodeId, isCurrentlySelected ? null : permissionId);
    }
  };

  const getPermissionButtonStyle = (
    permissionId: PermissionId | "self",
    blocked: boolean,
  ) => {
    const isSelected = data.selectedPermission === permissionId;

    if (blocked) {
      return PERMISSION_BUTTON_STYLES.blocked;
    }

    if (isSelected) {
      return PERMISSION_BUTTON_STYLES.selected;
    }

    return PERMISSION_BUTTON_STYLES.default;
  };

  const getNodeClassNames = () => {
    if (!isAccessible) {
      return NODE_STYLES.inaccessible;
    }

    if (hasSelectedPermission && data.selectedPermission) {
      return NODE_STYLES.selected;
    }

    return NODE_STYLES.default;
  };

  const getNodeInlineStyles = () => {
    if (hasSelectedPermission && data.selectedPermission) {
      // Find the permission in the data to get its color
      const selectedPermissionData = data.permissions.find(
        (perm) => perm.permissionId === data.selectedPermission,
      );

      if (selectedPermissionData) {
        return {
          backgroundColor: `${selectedPermissionData.color}${OPACITY.backgroundSelected}`,
          borderColor: selectedPermissionData.color,
          color: selectedPermissionData.color,
        };
      }
    }
    return {};
  };

  return (
    <div
      className={cn(
        `px-2 py-2 backdrop-blur-xl border flex gap-1 items-center rounded-sm
        min-w-[200px]`,
        getNodeClassNames(),
      )}
      style={getNodeInlineStyles()}
      aria-disabled={!isAccessible}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />

      {isAccessible && data.permissions.length > 0 && (
        <div className="flex gap-1">
          {data.permissions.map((permission) => {
            const countText =
              permission.count === null ? "∞" : permission.count.toString();
            const isBlocked = permission.blocked ?? false;

            return (
              <button
                key={permission.permissionId}
                style={{ backgroundColor: permission.color }}
                data-node-id={data.label} // Use label as node identifier
                className={cn(
                  `text-xs rounded-sm px-2 py-1 font-mono font-semibold transition-all border
                  border-border`,
                  "flex items-center gap-1 justify-center",
                  permission.color,
                  getPermissionButtonStyle(permission.permissionId, isBlocked),
                )}
                onClick={(e) =>
                  !isBlocked &&
                  handlePermissionButtonClick(e, permission.permissionId)
                }
                disabled={isBlocked}
                title={`${countText} available instances${isBlocked ? " (blocked)" : ""}`}
              >
                <span className="font-bold">{countText}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="font-mono text-sm leading-tight">{data.label}</div>

      <Handle type="source" isConnectable={false} position={Position.Right} />
    </div>
  );
});

NamespacePathNode.displayName = "NamespacePathNode";
