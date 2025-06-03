import { Card } from "@torus-ts/ui/components/card";
import type { CustomGraphData } from "./permission-graph-types";
import { memo } from "react";

interface PermissionGraphOverviewProps {
  graphData: CustomGraphData | null;
}

export const PermissionGraphOverview = memo(function PermissionGraphOverview({
  graphData,
}: PermissionGraphOverviewProps) {
  if (!graphData) {
    return (
      <Card className="h-9 w-full sm:w-auto flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div
            className="items-center animate-spin h-4 w-4 border-2 border-gray-700 border-t-gray-400
              rounded-full"
          />
          <span className="text-sm text-gray-400">Loading graph data...</span>
        </div>
      </Card>
    );
  }

  const Bar = () => <div className="h-4 w-px bg-gray-800" />;

  const Stat = ({ label, value }: { label: string; value: number }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );

  return (
    <Card className="h-9 w-full sm:w-auto flex items-center">
      <div className="px-2 sm:px-4 w-full">
        <div className="flex items-center justify-center gap-3">
          <div className="flex items-center gap-3">
            <Stat label="Addresses" value={graphData.nodes.length} />
            <Bar />
            <Stat label="Permissions" value={graphData.links.length} />
          </div>
        </div>
      </div>
    </Card>
  );
});
