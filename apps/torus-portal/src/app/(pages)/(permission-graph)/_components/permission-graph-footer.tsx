import { MousePointerClick } from "lucide-react";

import { MyAgentButton } from "./my-agent-button";
import { NodeColorLegendDropdown } from "./node-color-legend-dropdown";
import { PermissionGraphCommand } from "./permission-graph-command";
import { PermissionGraphOverview } from "./permission-graph-overview";
import type { CustomGraphNode } from "./permission-graph-types";

export function PermissionGraphFooter({
  handleNodeSelect,
}: {
  handleNodeSelect: (node: CustomGraphNode) => void;
}) {
  return (
    <div className="absolute bottom-3 left-3 right-3 z-50 flex flex-row justify-between gap-2">
      <div className="flex items-center justify-between gap-2 w-full md:w-fit animate-fade-up">
        <PermissionGraphCommand />
        <MyAgentButton onNodeClick={handleNodeSelect} />
      </div>
      <div className="hidden items-center gap-2 w-full xl:flex">
        <PermissionGraphOverview />
      </div>
      <div className="hidden lg:flex items-center gap-4">
        <div className="items-center gap-2 hidden 2xl:flex animate-fade-up animate-delay-700">
          <MousePointerClick className="w-4" />
          <span className="text-xs text-nowrap">
            Click on any node for details
          </span>
        </div>
        <NodeColorLegendDropdown />
      </div>
    </div>
  );
}
