import { memo } from "react";

import { Handle, Position } from "@xyflow/react";

import type { PermissionId } from "@torus-network/sdk/chain";

import { cn } from "@torus-ts/ui/lib/utils";

import type { NamespacePathNodeData } from "./namespace-path-selector-flow";
import { PermissionColorManager } from "./permission-colors";

interface NamespacePathNodeProps {
  data: NamespacePathNodeData;
  onPermissionSelect?: (
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
  const colorManager = new PermissionColorManager();

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
    const color = colorManager.getColorForPermission(permissionId);
    const isSelected = data.selectedPermission === permissionId;

    if (blocked) {
      return "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50";
    }

    if (isSelected) {
      return `${color.button} ${color.buttonText} ring-2 ring-offset-1 ring-blue-500`;
    }

    return `${color.button} ${color.buttonText} hover:opacity-80 transition-opacity`;
  };

  const getNodeStyle = () => {
    if (!isAccessible) {
      return "cursor-not-allowed bg-stone-700/10 text-stone-500/70 border-stone-500/10";
    }

    if (hasSelectedPermission && data.selectedPermission) {
      const color = colorManager.getColorForPermission(data.selectedPermission);
      return `${color.bg} ${color.border} ${color.text}`;
    }

    return "bg-muted border-border";
  };

  return (
    <div
      className={cn(
        `px-2 py-2 backdrop-blur-xl border flex gap-1 items-center rounded-sm
        min-w-[200px]`,
        getNodeStyle(),
      )}
      aria-disabled={!isAccessible}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />

      {isAccessible && data.permissions.length > 0 && (
        <div className="flex gap-1">
          {data.permissions.map((permission) => {
            const displayText = colorManager.getPermissionDisplayText(
              permission.permissionId,
            );
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
                title={`${displayText}: ${countText} delegations available${isBlocked ? " (blocked)" : ""}`}
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
