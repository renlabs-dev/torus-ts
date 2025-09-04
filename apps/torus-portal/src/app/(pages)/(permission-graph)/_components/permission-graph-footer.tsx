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
    <div className="absolute bottom-3 left-3 right-3 z-50 flex flex-col gap-2 md:flex-row md:justify-between">
      <div className="flex flex-col gap-2 md:hidden">
        <div className="flex w-full items-center gap-2">
          <div className="min-w-0 flex-1">{extraContent}</div>
          <ViewModeSwitcher />
        </div>
        <div className="w-full">
          <PermissionGraphCommand />
        </div>
      </div>

      {/* Desktop: Single row */}
      <div className="animate-fade-up hidden items-center gap-2 md:flex md:w-fit">
        <PermissionGraphCommand />
        {extraContent}
        <ViewModeSwitcher />
        <MyAgentButton onNodeClick={handleNodeSelect} />
      </div>

      <div className="hidden w-full items-center gap-2 2xl:flex">
        <PermissionGraphOverview />
      </div>
      <div className="hidden items-center gap-4 2xl:flex">
        <NodeColorLegendDropdown />
      </div>
    </div>
  );
}
