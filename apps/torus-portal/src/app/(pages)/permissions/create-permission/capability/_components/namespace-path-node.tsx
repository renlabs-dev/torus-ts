import { memo } from "react";

import { Handle, Position } from "@xyflow/react";

import { cn } from "@torus-ts/ui/lib/utils";

import type { NamespacePathNodeData } from "./namespace-path-selector-flow";

export const NamespacePathNode = memo(function NamespacePathNode({
  data,
}: {
  data: NamespacePathNodeData;
}) {
  const isAccessible = data.acessible;
  const isSelected = data.selected ?? false;

  return (
    <div
      className={cn(
        "px-4 py-2 backdrop-blur-xl border rounded-sm",
        isSelected
          ? "bg-green-500/10 border-green-500 text-green-500"
          : "bg-muted border-border",
        isAccessible
          ? "cursor-pointer"
          : "cursor-not-allowed bg-stone-700/10 text-stone-500/70 border-stone-500/10",
      )}
      onClick={isAccessible ? undefined : (e) => e.preventDefault()}
      aria-disabled={!isAccessible}
    >
      <Handle type="target" position={Position.Left} isConnectable={false} />

      <div
        className={cn(
          "absolute -top-3 -left-2 text-xs bg-muted rounded-sm border px-1 py-0.5",
          isSelected ? "border-green-500" : "border-border",
        )}
      >
        {data.redelegationCount}
      </div>

      <div className="font-mono text-sm leading-tight">{data.label}</div>

      <Handle type="source" isConnectable={false} position={Position.Right} />
    </div>
  );
});

NamespacePathNode.displayName = "NamespacePathNode";
