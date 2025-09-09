import type { PermissionId } from "@torus-network/sdk/chain";
import { cn } from "@torus-ts/ui/lib/utils";
import { Handle, Position } from "@xyflow/react";
import { Infinity as InfinityIcon, MouseOff } from "lucide-react";
import { memo } from "react";
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
        `flex cursor-default items-center gap-1 rounded-sm border px-2 py-2 pr-3 backdrop-blur-xl`,
        !isAccessible &&
          "cursor-not-allowed border-stone-500/10 bg-stone-700/10 text-stone-500/70",
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
                  `border-border rounded-sm border px-2 py-1 font-mono text-sm font-bold transition-all`,
                  "flex h-8 min-w-8 items-center justify-center gap-1",
                  getPermissionClasses(permission.permissionId).bg,

                  isDisabled &&
                    "cursor-not-allowed bg-gray-300 text-gray-500 opacity-50",
                  !isDisabled &&
                    "text-white transition-opacity hover:opacity-80",
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
              `border-border flex h-7 min-w-[28px] items-center justify-center rounded-sm border p-1 font-mono text-xs font-semibold`,
            )}
          >
            <MouseOff size={12} className="font-bold" />
          </button>
        )
      )}

      <div className="pl-1 font-mono text-sm leading-tight" title={data.label}>
        {getDisplayPath(data.label)}
      </div>

      <Handle type="source" isConnectable={false} position={Position.Right} />
    </div>
  );
});

NamespacePathNode.displayName = "NamespacePathNode";
