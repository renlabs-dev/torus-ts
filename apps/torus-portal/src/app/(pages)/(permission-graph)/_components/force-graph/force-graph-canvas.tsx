"use client";

import React, { Suspense, useCallback, useRef } from "react";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type {
  CustomGraphData,
  CustomGraphNode,
} from "../permission-graph-types";
import ForceGraph from "./force-graph-animation";

function ForceGraphScene({
  data,
  onNodeClick,
  userAddress,
  onResetCamera,
}: {
  data: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  onResetCamera: (callback: () => void) => void;
}) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const originalCameraPosition = useRef(new THREE.Vector3(0, 0, 600));
  const originalTarget = useRef(new THREE.Vector3(0, 0, 0));
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleNodeFocus = useCallback(
    (node: CustomGraphNode) => {
      if (!node.x || !node.y || !node.z) return;

      const distance = 100;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      const targetPosition = new THREE.Vector3(
        node.x * distRatio,
        node.y * distRatio,
        node.z * distRatio,
      );

      const targetLookAt = new THREE.Vector3(node.x, node.y, node.z);

      const animateCameraToTarget = (
        targetPos: THREE.Vector3,
        lookAt: THREE.Vector3,
        duration: number,
      ) => {
        const startPosition = camera.position.clone();
        const startTarget =
          controlsRef.current?.target.clone() ?? new THREE.Vector3();
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeProgress = 1 - Math.pow(1 - progress, 3);

          camera.position.lerpVectors(startPosition, targetPos, easeProgress);

          if (controlsRef.current) {
            controlsRef.current.target.lerpVectors(
              startTarget,
              lookAt,
              easeProgress,
            );
            controlsRef.current.update();
          }

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        animate();
      };

      animateCameraToTarget(targetPosition, targetLookAt, 2000);

      onNodeClick(node);

      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    },
    [camera, onNodeClick],
  );

  const resetCamera = useCallback(() => {
    const animateCameraToTarget = (
      targetPos: THREE.Vector3,
      lookAt: THREE.Vector3,
      duration: number,
    ) => {
      const startPosition = camera.position.clone();
      const startTarget =
        controlsRef.current?.target.clone() ?? new THREE.Vector3();
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        camera.position.lerpVectors(startPosition, targetPos, easeProgress);

        if (controlsRef.current) {
          controlsRef.current.target.lerpVectors(
            startTarget,
            lookAt,
            easeProgress,
          );
          controlsRef.current.update();
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    };

    animateCameraToTarget(
      originalCameraPosition.current,
      originalTarget.current,
      1500,
    );
  }, [camera]);

  React.useEffect(() => {
    onResetCamera(resetCamera);
  }, [onResetCamera, resetCamera]);

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
}: {
  data: CustomGraphData;
  onNodeClick: (node: CustomGraphNode) => void;
  userAddress?: string;
  onResetCamera?: (resetFn: () => void) => void;
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
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
