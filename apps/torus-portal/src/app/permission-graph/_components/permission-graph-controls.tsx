"use client";

import React, { memo } from "react";
import PermissionGraphSearch from "./permission-graph-search";

interface PermissionGraphControlsProps {
  nodeIds?: string[];
}

const PermissionGraphControls = memo(function PermissionGraphControls({ nodeIds = [] }: PermissionGraphControlsProps) {
  return (
    <div className="flex items-center gap-4 w-full max-w-4xl flex-wrap">
      <div className="flex-1 min-w-0">
        <PermissionGraphSearch graphNodes={nodeIds} />
      </div>
    </div>
  );
});

export default PermissionGraphControls;