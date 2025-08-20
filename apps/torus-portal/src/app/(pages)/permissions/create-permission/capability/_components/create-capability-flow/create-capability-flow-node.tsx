import { memo } from "react";

import { Handle, Position } from "@xyflow/react";
import { Infinity as InfinityIcon, MouseOff } from "lucide-react";

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

  const getDisplayPath = (fullPath: string): string => {
    const withoutAgentPrefix = fullPath.startsWith("agent.")
      ? fullPath.substring(6)
      : fullPath;

    if (!withoutAgentPrefix) return fullPath;

    const segments = withoutAgentPrefix.split(".");
    if (segments.length <= 1) return withoutAgentPrefix;

    return segments.slice(-2).join(".");
  };

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
        cursor-default pr-3`,
        !isAccessible &&
          "cursor-not-allowed bg-stone-700/10 text-stone-500/70 border-stone-500/10",
        isAccessible && "bg-muted border-border",
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
            const isDisabled = isBlocked || (!isInfinite && countNumber === 0);

            return (
              <button
                key={permission.permissionId}
                data-node-id={data.label}
                className={cn(
                  `text-sm rounded-sm px-2 py-1 font-mono font-bold transition-all border
                    border-border`,
                  "flex items-center gap-1 justify-center min-w-8 h-8 ",
                  getPermissionClasses(permission.permissionId).bg,

                  isDisabled &&
                    "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50",
                  !isDisabled &&
                    "text-white hover:opacity-80 transition-opacity",
                  isSelected && !isDisabled && "text-white",
                )}
                onClick={(e) =>
                  !isDisabled &&
                  handlePermissionButtonClick(e, permission.permissionId)
                }
                disabled={isDisabled}
                title={`${isInfinite ? "Unlimited" : countNumber} available instances${isDisabled ? (isBlocked ? " (blocked)" : " (no instances available)") : ""}`}
              >
                {isInfinite ? (
                  <InfinityIcon size={15} className="font-bold" />
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

      <div className="font-mono text-sm leading-tight pl-1" title={data.label}>
        {getDisplayPath(data.label)}
      </div>

      <Handle type="source" isConnectable={false} position={Position.Right} />
    </div>
  );
});

NamespacePathNode.displayName = "NamespacePathNode";
