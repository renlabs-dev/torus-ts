import type { Node } from "@xyflow/react";

import type { NamespacePathNodeData } from "../create-capability-flow-types";

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
    <div
      className="bg-muted/50 backdrop-blur-md border-border border rounded-sm p-2 z-50 shadow-lg
        space-y-1 max-w-screen-sm"
    >
      <div className="text-sm font-medium text-white">Root Selected Paths:</div>
      <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
        {Array.from(rootSelectedPaths).map((nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          return (
            <div key={nodeId} className="font-mono text-white">
              {String(node?.data.label ?? "")}
            </div>
          );
        })}
      </div>
      {descendantCount > 0 && (
        <div className="text-xs text-white/80 pt-23 border-t border-white/20">
          + {descendantCount} descendant paths (visual only)
        </div>
      )}
    </div>
  );
}
