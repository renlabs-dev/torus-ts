import { memo } from "react";
import { useGraphData } from "./force-graph/use-graph-data";

const Bar = () => <div className="h-4 w-px bg-gray-800" />;

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-medium text-gray-500">{label}</span>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
);

export const PermissionGraphOverview = memo(function PermissionGraphOverview() {
  const { graphData } = useGraphData();

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
    <div className="animate-fade-up animate-delay-500 flex h-9 w-full items-center sm:w-auto">
      <div className="w-full px-2 sm:px-4">
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
    </div>
  );
});
