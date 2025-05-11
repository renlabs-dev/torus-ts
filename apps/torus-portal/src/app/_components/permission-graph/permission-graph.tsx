"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { TrackballControls } from "@react-three/drei";
import type { GraphData, GraphNode } from "./permission-graph-utils";
import type { GraphProps } from "r3f-forcegraph";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface GraphxProps {
  graphData: GraphData;
  onNodeClick: (node: GraphNode) => void;
}

function Graph(props: GraphxProps) {
  const fgRef = useRef<GraphProps | null>(null);

  useFrame(() => {
    if (fgRef.current) {
      fgRef.current.tickFrame();
    }
  });

  return (
    <R3fForceGraph
      ref={fgRef}
      graphData={props.graphData}
      nodeColor={(node) => {
        return node.color;
      }}
      nodeLabel={(node) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        return node.name;
      }}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      linkColor={() => "rgba(255, 255, 255, 0.2)"}
      nodeRelSize={6}
      onNodeClick={(node) => {
        props.onNodeClick({
          id: String(node.id ?? ""),
          name: String(node.name ?? `Node ${node.id}`),
          color: String(node.color ?? "#ffffff"),
          val: Number(node.val ?? 1),
        });
      }}
    />
  );
}

export default function PermissionGraph({
  data,
  onNodeClick,
}: {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 100], far: 1000 }}>
      <color attach="background" args={[0.05, 0.05, 0.1]} />
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[0, 0, 5]} intensity={Math.PI / 2} />

      <Graph graphData={data} onNodeClick={onNodeClick} />
      <TrackballControls />
    </Canvas>
  );
}
