"use client";

import { useState } from "react";
import PermissionGraph from "./permission-graph";
import PermissionGraphControls from "./permission-graph-controls";
import { generateRandomTree } from "./permission-graph-utils";

export default function PermissionGraphContainer() {
  // Initialize with random graph data
  const [graphData, setGraphData] = useState(generateRandomTree(20));
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const handleNodeSelect = (node: any) => {
    setSelectedNode(node);
  };

  const handleDataChange = (newData: any) => {
    setGraphData(newData);
    setSelectedNode(null);
  };

  return (
    <div className="w-full flex flex-col">
      <PermissionGraphControls onDataChange={handleDataChange} />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:flex-1 h-[500px] md:h-[600px] bg-slate-900 rounded-lg overflow-hidden">
          <PermissionGraph
            data={graphData}
            height={600}
            onNodeClick={handleNodeSelect}
          />
        </div>

        {/* Info panel - optional */}
        <div className="w-full lg:w-80 p-4 bg-slate-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            {selectedNode ? "Node Details" : "Graph Information"}
          </h3>

          {selectedNode ? (
            <div>
              <p>
                <span className="font-medium">ID:</span> {selectedNode.id}
              </p>
              <p>
                <span className="font-medium">Name:</span> {selectedNode.name}
              </p>
              {selectedNode.val && (
                <p>
                  <span className="font-medium">Value:</span> {selectedNode.val}
                </p>
              )}
              <div className="mt-2">
                <span className="font-medium">Color:</span>
                <div
                  className="inline-block ml-2 w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedNode.color }}
                />
              </div>
            </div>
          ) : (
            <div>
              <p>
                <span className="font-medium">Nodes:</span>{" "}
                {graphData.nodes.length}
              </p>
              <p>
                <span className="font-medium">Links:</span>{" "}
                {graphData.links.length}
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Click on a node to view its details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
