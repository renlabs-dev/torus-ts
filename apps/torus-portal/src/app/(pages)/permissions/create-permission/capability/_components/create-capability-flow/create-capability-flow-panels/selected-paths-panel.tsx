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
    <div className="bg-muted/50 border-border z-50 max-w-screen-sm space-y-1 rounded-sm border p-2 shadow-lg backdrop-blur-md">
      <div className="text-sm font-medium text-white">Root Selected Paths:</div>
      <div className="max-h-32 space-y-1 overflow-y-auto text-xs">
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
        <div className="pt-23 border-t border-white/20 text-xs text-white/80">
          + {descendantCount} descendant paths (visual only)
        </div>
      )}
    </div>
  );
}
