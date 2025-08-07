import { memo } from "react";

import { Handle, Position } from "@xyflow/react";

import type { PermissionId } from "@torus-network/sdk/chain";

import { cn } from "@torus-ts/ui/lib/utils";

import type { NamespacePathNodeData } from "./types";

interface NamespacePathNodeProps {
  data: NamespacePathNodeData;
  onPermissionSelect: (
    nodeId: string,
    permissionId: PermissionId | "self" | null,
  ) => void;
}

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

    const nodeId = e.currentTarget.getAttribute("data-node-id");
    if (!nodeId) return;
    const isCurrentlySelected = data.selectedPermission === permissionId;

    // If clicking the same permission, deselect it
    onPermissionSelect(nodeId, isCurrentlySelected ? null : permissionId);
  };

  const getPermissionButtonStyle = (
    permissionId: PermissionId | "self",
    blocked: boolean,
  ) => {
    const isSelected = data.selectedPermission === permissionId;

    const PERMISSION_BUTTON_STYLES = {
      blocked: "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50",
      selected: "text-white",
      default: "text-white hover:opacity-80 transition-opacity",
    } as const;

    if (blocked) {
      return PERMISSION_BUTTON_STYLES.blocked;
    }

    if (isSelected) {
      return PERMISSION_BUTTON_STYLES.selected;
    }

    return PERMISSION_BUTTON_STYLES.default;
  };

  const getNodeClassNames = () => {
    const NODE_STYLES = {
      inaccessible:
        "cursor-not-allowed bg-stone-700/10 text-stone-500/70 border-stone-500/10",
      selected: "border-2",
      default: "bg-muted border-border",
    } as const;

    if (!isAccessible) {
      return NODE_STYLES.inaccessible;
    }

    if (hasSelectedPermission && data.selectedPermission) {
      return NODE_STYLES.selected;
    }

    return NODE_STYLES.default;
  };

  const getSelectedPermissionClasses = () => {
    if (hasSelectedPermission && data.selectedPermission) {
      // Find the permission in the data to get its color
      const selectedPermissionData = data.permissions.find(
        (perm) => perm.permissionId === data.selectedPermission,
      );

      if (selectedPermissionData) {
        const colorName = selectedPermissionData.colorName;
        return `bg-${colorName}-500/10 border-${colorName}-500 text-${colorName}-500`;
      }
    }
    return "";
  };

  return (
    <div
      className={cn(
        `px-2 py-2 backdrop-blur-xl border flex gap-1 items-center rounded-sm
        min-w-[200px]`,
        getNodeClassNames(),
        getSelectedPermissionClasses(),
      )}
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
                data-node-id={data.label} // Use label as node identifier
                className={cn(
                  `text-xs rounded-sm px-2 py-1 font-mono font-semibold transition-all border
                  border-border`,
                  "flex items-center gap-1 justify-center",
                  `bg-${permission.colorName}-500 text-white`,
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
