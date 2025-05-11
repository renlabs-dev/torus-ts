'use client';

import { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { TrackballControls } from "@react-three/drei";
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with window object
const R3fForceGraph = dynamic(() => import('r3f-forcegraph'), { ssr: false });

// Graph component that handles rendering the force directed graph
const Graph = ({
  graphData,
  onNodeClick,
}: {
  graphData: any;
  onNodeClick?: (node: any) => void;
}) => {
  const fgRef = useRef<any>(null);

  // Update the graph on each animation frame
  useFrame(() => {
    if (fgRef.current) {
      fgRef.current.tickFrame();
    }
  });

  return (
    <R3fForceGraph
      ref={fgRef}
      graphData={graphData}
      nodeColor={(node) => node.color}
      // nodeLabel={(node) => node.name}
      linkDirectionalArrowLength={3.5}
      linkDirectionalArrowRelPos={1}
      linkCurvature={0.25}
      linkColor={() => "rgba(255, 255, 255, 0.2)"}
      nodeRelSize={6}
      onNodeClick={(node) => {
        // Handle node click event
        console.log("Clicked node:", node);
        if (onNodeClick) {
          onNodeClick(node);
        }
      }}
    />
  );
};

// Main permission graph component
export default function PermissionGraph({
  data,
  height = 600,
  onNodeClick,
}: {
  data: any;
  height?: number;
  onNodeClick?: (node: any) => void;
}) {
  return (
    <div style={{ height, width: "100%", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 100], far: 1000 }}>
        <color attach="background" args={[0.05, 0.05, 0.1]} />
        <ambientLight intensity={Math.PI / 2} />
        <directionalLight position={[0, 0, 5]} intensity={Math.PI / 2} />
        <Suspense fallback={null}>
          <Graph graphData={data} onNodeClick={onNodeClick} />
          <TrackballControls />
        </Suspense>
      </Canvas>
    </div>
  );
}
