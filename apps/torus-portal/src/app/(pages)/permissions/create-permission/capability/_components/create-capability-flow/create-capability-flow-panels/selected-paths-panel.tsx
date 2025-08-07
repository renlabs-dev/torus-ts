import type { Node } from "@xyflow/react";

import type { NamespacePathNodeData } from "../types";

interface SelectedPathsPanelProps {
  rootSelectedPaths: Set<string>;
  selectedPaths: Set<string>;
  nodes: Node<NamespacePathNodeData>[];
}

export function SelectedPathsPanel({
  rootSelectedPaths,
  selectedPaths,
  nodes,
}: SelectedPathsPanelProps) {
  if (rootSelectedPaths.size === 0) {
    return null;
  }

  const descendantCount = selectedPaths.size - rootSelectedPaths.size;

  return (
    <div className="space-y-1">
      <div className="text-sm font-medium text-green-700 dark:text-green-300">
        Root Selected Paths:
      </div>
      <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
        {Array.from(rootSelectedPaths).map((nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          return (
            <div
              key={nodeId}
              className="font-mono text-green-600 dark:text-green-400"
            >
              {String(node?.data.label ?? "")}
            </div>
          );
        })}
      </div>
      {descendantCount > 0 && (
        <div className="text-xs text-green-500/80 pt-1 border-t border-green-500/20">
          + {descendantCount} descendant paths (visual only)
        </div>
      )}
    </div>
  );
}