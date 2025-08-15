import React, { useCallback, useRef } from "react";

import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

import type { CustomGraphNode } from "../permission-graph-types";

export function useCameraFocus(
  controlsRef: React.RefObject<OrbitControlsImpl | null>,
  onNodeClick: (node: CustomGraphNode) => void,
  onResetCamera: (callback: () => void) => void,
  initialNode?: CustomGraphNode | null,
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

        // Use a more aggressive easing that finishes faster
        // This easing accelerates quickly and reaches near-completion sooner
        const easeProgress =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        camera.position.lerpVectors(startPosition, targetPos, easeProgress);

        if (controlsRef.current) {
          controlsRef.current.target.lerpVectors(
            startTarget,
            lookAt,
            easeProgress,
          );
          controlsRef.current.update();
        }

        // Check if we're close enough to the target position (use squared distance for performance)
        const distanceToTargetSq = camera.position.distanceToSquared(targetPos);
        const targetDistanceToLookAtSq =
          controlsRef.current?.target.distanceToSquared(lookAt) ?? 0;

        // Stop when we're within 5 units of target OR 90% of time has elapsed
        // This prevents the slow tail while ensuring we get close enough
        if (
          distanceToTargetSq > 25 &&
          targetDistanceToLookAtSq > 4 &&
          progress < 0.9
        ) {
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

      const distance = 300;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      const targetPosition = new THREE.Vector3(
        node.x * distRatio,
        node.y * distRatio,
        node.z * distRatio,
      );

      const targetLookAt = new THREE.Vector3(node.x, node.y, node.z);

      animateCameraToTarget(targetPosition, targetLookAt, 1500);

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
      1200,
    );
  }, [animateCameraToTarget]);

  React.useEffect(() => {
    onResetCamera(resetCamera);
  }, [onResetCamera, resetCamera]);

  React.useEffect(() => {
    if (!initialNode) return;

    const timeoutId = setTimeout(() => {
      const { x, y, z } = initialNode;

      if (x !== undefined && y !== undefined && z !== undefined) {
        const focusDistance = 350;
        const distRatio = 1 + focusDistance / Math.hypot(x, y, z);

        const targetPosition = new THREE.Vector3(
          x * distRatio,
          y * distRatio,
          z * distRatio,
        );

        const targetLookAt = new THREE.Vector3(x, y, z);
        animateCameraToTarget(targetPosition, targetLookAt, 1200);
      }
    }, 1500); // Wait 1.5 seconds for force simulation to stabilize

    return () => {
      clearTimeout(timeoutId);
    };
  }, [initialNode, animateCameraToTarget]);

  return {
    handleNodeFocus,
    resetCamera,
  };
}
