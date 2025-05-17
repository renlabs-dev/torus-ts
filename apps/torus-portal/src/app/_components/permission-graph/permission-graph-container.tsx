"use client";

import { useState, useEffect } from "react";
import PermissionGraph from "./permission-graph";
import PermissionGraphControls from "./permission-graph-controls";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-utils";
import { samplePermissionGraph } from "./permission-graph-utils";
import { PermissionGraphDetails } from "./permission-graph-details";

export default function PermissionGraphContainer() {
  const [graphData, setGraphData] = useState<CustomGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );

  useEffect(() => {
    setGraphData(samplePermissionGraph);
  }, []);

  const handleNodeSelect = (node: CustomGraphNode) => {
    setSelectedNode(node);
  };

  const handleDataChange = (newData: CustomGraphData) => {
    setGraphData(newData);
    setSelectedNode(null);
  };

  return (
    <div className="w-full flex flex-col">
      <PermissionGraphControls onDataChange={handleDataChange} />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:flex-1 h-[500px] md:h-[600px] rounded-lg overflow-hidden">
          <PermissionGraph data={graphData} onNodeClick={handleNodeSelect} />
        </div>

        <PermissionGraphDetails
          selectedNode={selectedNode}
          graphData={graphData}
        />
      </div>
    </div>
  );
}
