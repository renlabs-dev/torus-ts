"use client";

import React, { useState } from "react";
import {
  generateRandomTree,
  samplePermissionGraph,
} from "./permission-graph-utils";
import type { GraphData } from "./permission-graph-utils";

interface PermissionGraphControlsProps {
  onDataChange: (data: GraphData) => void;
}

export default function PermissionGraphControls({
  onDataChange,
}: PermissionGraphControlsProps) {
  const [nodeCount, setNodeCount] = useState(20);

  // Load sample permission graph
  const loadSampleGraph = () => {
    onDataChange(samplePermissionGraph);
  };

  // Generate random graph with specified number of nodes
  const generateRandomGraph = () => {
    onDataChange(generateRandomTree(nodeCount));
  };

  return (
    <div className="flex flex-col gap-4 mb-4 absolute top-20 p-4 bg-slate-800 rounded-lg">
      <h3 className="text-lg font-semibold">Graph Controls</h3>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="nodeCount" className="text-sm font-medium">
            Node Count:
          </label>
          <input
            id="nodeCount"
            type="number"
            min="5"
            max="100"
            value={nodeCount}
            onChange={(e) => setNodeCount(parseInt(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
          />
        </div>

        <button
          onClick={generateRandomGraph}
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          Generate Random Graph
        </button>

        <button
          onClick={loadSampleGraph}
          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
        >
          Load Sample Permission Graph
        </button>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">
        <p>Tip: Use mouse to interact with the graph:</p>
        <ul className="list-disc list-inside ml-2">
          <li>Click and drag to rotate</li>
          <li>Scroll to zoom</li>
          <li>Click on nodes to inspect</li>
        </ul>
      </div>
    </div>
  );
}
