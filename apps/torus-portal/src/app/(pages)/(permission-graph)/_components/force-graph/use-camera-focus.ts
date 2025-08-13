import React, { useCallback, useRef } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { CustomGraphNode } from "../permission-graph-types";

export function useCameraFocus(
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>,
  onNodeClick: (node: CustomGraphNode) => void,
  onResetCamera: (callback: () => void) => void,
) {
  const { camera } = useThree();
  const originalCameraPosition = useRef(new THREE.Vector3(0, 0, 600));
  const originalTarget = useRef(new THREE.Vector3(0, 0, 0));
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animateCameraToTarget = useCallback(
    (targetPos: THREE.Vector3, lookAt: THREE.Vector3, duration: number) => {
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
    },
    [camera, controlsRef],
  );

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

      animateCameraToTarget(targetPosition, targetLookAt, 2000);

      onNodeClick(node);

      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    },
    [animateCameraToTarget, onNodeClick],
  );

  const resetCamera = useCallback(() => {
    animateCameraToTarget(
      originalCameraPosition.current,
      originalTarget.current,
      1500,
    );
  }, [animateCameraToTarget]);

  React.useEffect(() => {
    onResetCamera(resetCamera);
  }, [onResetCamera, resetCamera]);

  return {
    handleNodeFocus,
    resetCamera,
  };
}