import { MousePointerClick } from "lucide-react";
import { MyAgentButton } from "./my-agent-button";
import { NodeColorLegendDropdown } from "./node-color-legend-dropdown";
import { PermissionGraphCommand } from "./permission-graph-command";
import { PermissionGraphOverview } from "./permission-graph-overview";
import type { CustomGraphNode } from "./permission-graph-types";
import { ViewModeSwitcher } from "./view-mode-switcher";

export function PermissionGraphFooter({
  handleNodeSelect,
  extraContent,
}: {
  handleNodeSelect: (node: CustomGraphNode) => void;
  extraContent?: React.ReactNode;
}) {
  return (
    <div className="absolute bottom-3 left-3 right-3 z-50 flex flex-row justify-between gap-2">
      <div className="animate-fade-up flex w-full items-center justify-between gap-2 md:w-fit">
        <PermissionGraphCommand />
        {extraContent}
        <ViewModeSwitcher />
        <MyAgentButton onNodeClick={handleNodeSelect} />
      </div>
      <div className="hidden w-full items-center gap-2 xl:flex">
        <PermissionGraphOverview />
      </div>
      <div className="hidden items-center gap-4 lg:flex">
        <div className="animate-fade-up animate-delay-700 hidden items-center gap-2 2xl:flex">
          <MousePointerClick className="w-4" />
          <span className="text-nowrap text-xs">
            Click on any node for details
          </span>
        </div>
        <NodeColorLegendDropdown />
      </div>
    </div>
  );
}
