"use client";

import { Suspense } from "react";

import { Environment, Lightformer, OrbitControls } from "@react-three/drei";
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
    <div className="fixed inset-0 z-0 animate-fade animate-delay-1000">
      <Canvas camera={{ position: [0, 0, 600], far: 8000 }} shadows>
        <color attach="background" args={["#0E0E11"]} />
        <ambientLight intensity={0.6} />
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 3, 0, 1]}>
            <Lightformer
              form="circle"
              intensity={3}
              rotation-x={Math.PI / 2}
              position={[0, 5, -9]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={4}
              rotation-y={Math.PI / 2}
              position={[-5, 1, -1]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={2}
              rotation-y={Math.PI / 2}
              position={[-5, -1, -1]}
              scale={2}
            />
            <Lightformer
              form="circle"
              intensity={6}
              rotation-y={-Math.PI / 2}
              position={[10, 1, 0]}
              scale={6}
            />
            <Lightformer
              form="ring"
              color="#4060ff"
              intensity={4}
              onUpdate={(self) => self.lookAt(0, 0, 0)}
              position={[10, 10, 0]}
              scale={5}
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
              intensity={1}
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
