"use client";

import { Suspense } from "react";

import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, N8AO } from "@react-three/postprocessing";

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
    <div className="fixed inset-0 z-0 animate-fade animate-delay-1000">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: false }}
        camera={{ position: [0, 0, 600], far: 8000 }}
      >
        <color attach="background" args={["#0E0E11"]} />
        <ambientLight intensity={0.8} />
        <spotLight
          position={[10, 10, 10]}
          angle={0.15}
          penumbra={1}
          intensity={1}
          castShadow
        />

        <EffectComposer multisampling={8}>
          <N8AO distanceFalloff={1} aoRadius={1} intensity={0} />
        </EffectComposer>
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer
              form="circle"
              intensity={2}
              rotation-x={Math.PI / 2}
              position={[0, 5, -9]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={1}
              rotation-y={Math.PI / 2}
              position={[-5, 1, -1]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={1}
              rotation-y={Math.PI / 2}
              position={[-5, -1, -1]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={1}
              rotation-y={-Math.PI / 2}
              position={[10, 1, 0]}
              scale={8}
            />
          </group>
        </Environment>

        <Suspense fallback={null}>
          <ForceGraph
            graphData={data}
            onNodeClick={onNodeClick}
            userAddress={userAddress}
          />

          <OrbitControls dampingFactor={0.01} enablePan={false} />
          <EffectComposer>
            <Bloom
              mipmapBlur
              intensity={0.6}
              luminanceThreshold={0.1}
              luminanceSmoothing={1.5}
              levels={7}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  );
}
