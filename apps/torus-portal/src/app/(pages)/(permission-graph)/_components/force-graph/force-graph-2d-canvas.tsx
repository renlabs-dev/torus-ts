"use client";

import { Suspense } from "react";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import ForceGraph2D from "./force-graph-2d";

export function ForceGraph2DCanvas({
  data,
  onNodeClick,
  userAddress,
}: {
  data: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
}) {
  return (
    <div 
      className="fixed inset-0 z-0 animate-fade animate-delay-1000"
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <div style={{ pointerEvents: 'auto' }}>
          <ForceGraph2D
            graphData={data}
            onNodeClick={onNodeClick}
            userAddress={userAddress}
          />
        </div>
      </Suspense>
    </div>
  );
}