"use client";

import dynamic from "next/dynamic";
import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { TrackballControls } from "@react-three/drei";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-utils";
import type { GraphMethods, NodeObject } from "r3f-forcegraph";

const R3fForceGraph = dynamic(() => import("r3f-forcegraph"), { ssr: false });

interface ForceGraphProps {
  graphData: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
}

function ForceGraph(props: ForceGraphProps) {
  const fgRef = useRef<GraphMethods>(null);

  useFrame(() => {
    if (fgRef.current) {
      fgRef.current.tickFrame();
    }
  });

  const formattedData = {
    nodes: props.graphData.nodes.map((node) => ({
      id: node.id,
      name: node.name,
      color: node.color,
      val: node.val,
    })),
    links: props.graphData.links.map((link) => ({
      source: link.source,
      target: link.target,
    })),
  };

  return (
    <R3fForceGraph
      ref={fgRef}
      graphData={formattedData}
      nodeColor={(node: NodeObject) => String(node.color)}
      nodeLabel={(node: NodeObject) => String(node.name ?? "")}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.4}
      linkColor={() => "rgba(255, 255, 255, 0.2)"}
      nodeRelSize={6}
      onNodeClick={(node: NodeObject) => {
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
  data: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 100], far: 1000 }}>
      <color attach="background" args={[0.05, 0.05, 0.1]} />
      <ambientLight intensity={Math.PI / 2} />
      <directionalLight position={[0, 0, 5]} intensity={Math.PI / 2} />
      <Suspense fallback={null}>
        <ForceGraph graphData={data} onNodeClick={onNodeClick} />
        <TrackballControls />
      </Suspense>
    </Canvas>
  );
}
