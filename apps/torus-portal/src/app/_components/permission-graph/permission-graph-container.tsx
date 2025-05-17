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
    <div className="fixed inset-0 w-screen h-screen">
      <div className="absolute top-[4.3rem] left-3 right-4 z-10">
        <PermissionGraphControls onDataChange={handleDataChange} />
      </div>

      <div className="absolute top-0 right-4 mt-[calc(4rem+70px)] w-80 z-10">
        <PermissionGraphDetails
          selectedNode={selectedNode}
          graphData={graphData}
        />
      </div>

      <div className="w-full h-full">
        <PermissionGraph data={graphData} onNodeClick={handleNodeSelect} />
      </div>
    </div>
  );
}
