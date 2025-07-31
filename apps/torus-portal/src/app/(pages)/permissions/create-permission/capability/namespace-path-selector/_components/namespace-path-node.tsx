import { memo } from "react";

import { Handle, Position } from "@xyflow/react";

interface NamespacePathNodeData extends Record<string, unknown> {
  label: string;
  acessible: boolean;
  redelegationCount: number;
  selected?: boolean;
}

interface NamespacePathNodeProps {
  id: string;
  data: NamespacePathNodeData;
  selected: boolean;
}

export const NamespacePathNode = memo(function NamespacePathNode({
  data,
}: NamespacePathNodeProps) {
  const isAccessible = data.acessible;
  const isSelected = data.selected ?? false;

  return (
    <div
      className="px-4 py-2 rounded-lg border-2 text-sm font-medium min-w-[120px] text-center bg-white border-gray-300 text-gray-900"
      style={{ 
        backgroundColor: isSelected ? '#dcfce7' : '#ffffff',
        borderColor: isSelected ? '#16a34a' : isAccessible ? '#d1d5db' : '#9ca3af',
        opacity: isAccessible ? 1 : 0.6,
        cursor: isAccessible ? 'pointer' : 'not-allowed'
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-border"
        isConnectable={false}
      />

      <div className="space-y-1">
        <div className="font-mono text-xs leading-tight">{data.label}</div>
        <div className="text-xs text-muted-foreground">
          {data.redelegationCount} delegations
        </div>
        {!isAccessible && (
          <div className="text-xs text-orange-600 dark:text-orange-400">
            View only
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-border"
        isConnectable={false}
      />
    </div>
  );
});

NamespacePathNode.displayName = "NamespacePathNode";
