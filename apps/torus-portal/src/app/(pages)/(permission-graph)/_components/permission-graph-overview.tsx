import { memo } from "react";

import { Card } from "@torus-ts/ui/components/card";

import type { CustomGraphData } from "./permission-graph-types";

interface PermissionGraphOverviewProps {
  graphData: CustomGraphData | null;
}

export const PermissionGraphOverview = memo(function PermissionGraphOverview({
  graphData,
}: PermissionGraphOverviewProps) {
  const Bar = () => <div className="h-4 w-px bg-gray-800" />;

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );

  const agentCount = graphData
    ? graphData.nodes.filter(
        (node) =>
          node.nodeType === "allocator" ||
          node.nodeType === "root_agent" ||
          node.nodeType === "target_agent",
      ).length
    : 0;

  const permissionCount = graphData
    ? graphData.nodes.filter((node) => node.nodeType === "permission").length
    : 0;

  const signalCount = graphData
    ? graphData.nodes.filter((node) => node.nodeType === "signal").length
    : 0;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Card className="h-9 w-full sm:w-auto flex items-center animate-fade-down animate-delay-200">
        <div className="px-2 sm:px-4 w-full">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-3">
              <Stat
                label="Nodes"
                value={graphData ? graphData.nodes.length : 0}
              />
              <Bar />
              <Stat
                label="Links"
                value={graphData ? graphData.links.length : 0}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="h-9 w-full sm:w-auto flex items-center animate-fade-down animate-delay-300">
        <div className="px-2 sm:px-4 w-full">
          <div className="flex items-center justify-center gap-3">
            <div className="flex items-center gap-3">
              <Stat label="Agents" value={agentCount} />
              <Bar />
              <Stat label="Permissions" value={permissionCount} />
              <Bar />
              <Stat label="Signals" value={signalCount} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
});
