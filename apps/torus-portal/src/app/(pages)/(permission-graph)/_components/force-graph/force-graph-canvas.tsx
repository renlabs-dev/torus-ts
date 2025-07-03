"use client";

import { Suspense } from "react";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import ForceGraph from "./force-graph-animation";

export function ForceGraphCanvas({
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
      {/* <color attach="background" args={["#252530"]} /> */}
      <ambientLight intensity={1.01} />
      <hemisphereLight
        intensity={1.125}
        color="#8040df"
        groundColor="#bfdbfe"
      />
      <spotLight
        castShadow
        color="orange"
        intensity={2}
        position={[-50, 50, 40]}
        angle={0.25}
        penumbra={1}
        shadow-mapSize={[128, 128]}
        shadow-bias={0.00005}
      />

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
