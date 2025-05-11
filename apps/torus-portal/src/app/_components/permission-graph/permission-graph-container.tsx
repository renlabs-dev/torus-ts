"use client";

import { useState, useEffect } from "react";
import PermissionGraph from "./permission-graph";
import PermissionGraphControls from "./permission-graph-controls";
import { samplePermissionGraph } from "./permission-graph-utils";
import type { GraphData, GraphNode } from "./permission-graph-utils";

export default function PermissionGraphContainer() {
  // Use null as initial state to avoid hydration mismatch
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Initialize graph data on the client side only
  useEffect(() => {
    setGraphData(samplePermissionGraph);
  }, []);

  const handleNodeSelect = (node: GraphNode) => {
    setSelectedNode(node);
  };

  const handleDataChange = (newData: GraphData) => {
    setGraphData(newData);
    setSelectedNode(null);
  };

  return (
    <div className="w-full flex flex-col">
      <PermissionGraphControls onDataChange={handleDataChange} />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:flex-1 h-[500px] md:h-[600px] rounded-lg overflow-hidden">
          {graphData && (
            <PermissionGraph data={graphData} onNodeClick={handleNodeSelect} />
          )}
          {!graphData && (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              Loading graph...
            </div>
          )}
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
              {graphData ? (
                <>
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
                </>
              ) : (
                <p className="text-slate-400">Loading graph data...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
