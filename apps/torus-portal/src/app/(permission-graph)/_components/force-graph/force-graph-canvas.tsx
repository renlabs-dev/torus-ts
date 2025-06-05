"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import ForceGraph from "./force-graph-animation";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

export function PermissionGraph({
  data,
  onNodeClick,
  userAddress,
}: {
  data: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 600], far: 8000 }} shadows>
      {/* <color attach="background" args={[0.05, 0.05, 0.1]} /> */}
      <ambientLight intensity={Math.PI / 2} />
      <Suspense fallback={null}>
        <ForceGraph
          graphData={data}
          onNodeClick={onNodeClick}
          userAddress={userAddress}
        />
        <OrbitControls dampingFactor={0.01} enablePan={false} />
        <EffectComposer>
          <Bloom intensity={2} luminanceThreshold={0} luminanceSmoothing={1} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}
