import { memo } from "react";

import { Handle, Position } from "@xyflow/react";
import { MouseOff, Route } from "lucide-react";

import type { PermissionId } from "@torus-network/sdk/chain";

import { cn } from "@torus-ts/ui/lib/utils";

import { getPermissionClasses } from "./create-capability-flow-colors";
import type { NamespacePathNodeData } from "./create-capability-flow-types";

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

    onPermissionSelect(nodeId, isCurrentlySelected ? null : permissionId);
  };

  return (
    <div
      className={cn(
        `px-2 py-2 backdrop-blur-xl border flex gap-1 items-center rounded-sm
        cursor-default min-w-[200px]`,
        // Accessibility styling
        !isAccessible &&
          "cursor-not-allowed bg-stone-700/10 text-stone-500/70 border-stone-500/10",
        isAccessible && "bg-muted border-border",
        // Selected permission styling
        hasSelectedPermission &&
          data.selectedPermission &&
          getPermissionClasses(data.selectedPermission).selected,
      )}
      aria-disabled={!isAccessible}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />

      {data.permissions.length > 0 ? (
        <div className="flex gap-1">
          {data.permissions.map((permission) => {
            const isBlocked = permission.blocked ?? false;
            const isSelected =
              data.selectedPermission === permission.permissionId;
            const isInfinite = permission.count === null;
            const countNumber = permission.count ?? 0;

            return (
              <button
                key={permission.permissionId}
                data-node-id={data.label} // Use label as node identifier
                className={cn(
                  `text-xs rounded-sm px-2 py-1 font-mono font-semibold transition-all border
                    border-border`,
                  "flex items-center gap-1 justify-center min-w-[28px] h-7",
                  getPermissionClasses(permission.permissionId).bg,
                  // Button state styling
                  isBlocked &&
                    "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50",
                  !isBlocked &&
                    "text-white hover:opacity-80 transition-opacity",
                  isSelected && !isBlocked && "text-white",
                )}
                onClick={(e) =>
                  !isBlocked &&
                  handlePermissionButtonClick(e, permission.permissionId)
                }
                disabled={isBlocked}
                title={`${isInfinite ? "Unlimited" : countNumber} available instances${isBlocked ? " (blocked)" : ""}`}
              >
                {isInfinite ? (
                  <Route size={12} className="font-bold" />
                ) : (
                  <span className="font-bold">{countNumber}</span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        !isAccessible && (
          <button
            disabled
            className={cn(
              `text-xs rounded-sm p-1 font-mono font-semibold border border-border min-w-[28px]
                items-center h-7 flex justify-center`,
            )}
          >
            <MouseOff size={12} className="font-bold" />
          </button>
        )
      )}

      <div className="font-mono text-sm leading-tight">{data.label}</div>

      <Handle type="source" isConnectable={false} position={Position.Right} />
    </div>
  );
});

NamespacePathNode.displayName = "NamespacePathNode";
