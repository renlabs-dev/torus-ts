import { Card } from "@torus-ts/ui/components/card";
import type { CustomGraphData } from "./permission-graph-utils";
import { memo } from "react";

interface PermissionGraphOverviewProps {
  graphData: CustomGraphData | null;
}

const roleColors = [
  { color: '#ff6b6b', label: 'Grantor' },
  { color: '#1dd1a1', label: 'Grantee' },
  { color: '#5f27cd', label: 'Both (Grantor & Grantee)' }
];

export const PermissionGraphOverview = memo(function PermissionGraphOverview({ graphData }: PermissionGraphOverviewProps) {
  return (
    <Card className="z-50 w-full p-4 h-full">

      <h2 className="text-lg font-semibold mb-3">Graph Information</h2>
      
      {graphData ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 z-50">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Addresses</span>
              <div className="text-xl font-semibold">{graphData.nodes.length}</div>
            </div>
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Permissions</span>
              <div className="text-xl font-semibold">{graphData.links.length}</div>
            </div>
          </div>
          
          <div className="z-50 mb-4">
            <h4 className="text-md font-semibold mb-2">Role Legend</h4>
            <div className="space-y-2">
              {roleColors.map(({ color, label }) => (
                <div key={label} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: color }} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Click on a node to view its permissions in detail.
          </span>
        </>
      ) : (
        <span className="text-slate-400">Loading graph data...</span>
      )}
    </Card>
  );
});