"use client";

import React, { Suspense, useCallback, useRef } from "react";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import ForceGraph from "./force-graph-animation";
import { useCameraFocus } from "./use-camera-focus";

function ForceGraphScene({
  data,
  onNodeClick,
  userAddress,
  onResetCamera,
  initialNode,
  selectedNodeId,
}: {
  data: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  onResetCamera: (callback: () => void) => void;
  initialNode?: CustomGraphNode | null;
  selectedNodeId?: string | null;
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const { handleNodeFocus } = useCameraFocus(
    controlsRef,
    onNodeClick,
    onResetCamera,
    initialNode,
  );

  return (
    <>
      <ambientLight intensity={1.01} />
      <hemisphereLight
        intensity={1.125}
        color="#8040df"
        groundColor="#bfdbfe"
      />
      <spotLight
        castShadow
        color="blue"
        intensity={2}
        position={[-50, 50, 40]}
        angle={0.25}
        penumbra={1}
        shadow-mapSize={[128, 128]}
        shadow-bias={0.00005}
      />

      <ForceGraph
        graphData={data}
        onNodeClick={handleNodeFocus}
        userAddress={userAddress}
        selectedNodeId={selectedNodeId}
      />
      <OrbitControls ref={controlsRef} dampingFactor={0.01} enablePan={false} />
      <EffectComposer>
        <Bloom intensity={1} luminanceThreshold={0} luminanceSmoothing={1.5} />
      </EffectComposer>
    </>
  );
}

export function ForceGraphCanvas({
  data,
  onNodeClick,
  userAddress,
  onResetCamera,
  initialNode,
  selectedNodeId,
}: {
  data: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  onResetCamera?: (resetFn: () => void) => void;
  initialNode?: CustomGraphNode | null;
  selectedNodeId?: string | null;
}) {
  const handleNodeClick = useCallback(
    (node: CustomGraphNode) => {
      onNodeClick(node);
    },
    [onNodeClick],
  );

  const handleSetResetCamera = useCallback(
    (callback: () => void) => {
      const wrappedCallback = () => {
        callback();
      };
      onResetCamera?.(wrappedCallback);
    },
    [onResetCamera],
  );

  return (
    <div className="fixed inset-0 z-0 animate-fade animate-delay-1000">
      <Canvas camera={{ position: [0, 0, 600], far: 8000 }} shadows>
        <Suspense fallback={null}>
          <ForceGraphScene
            data={data}
            onNodeClick={handleNodeClick}
            userAddress={userAddress}
            onResetCamera={handleSetResetCamera}
            initialNode={initialNode}
            selectedNodeId={selectedNodeId}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
