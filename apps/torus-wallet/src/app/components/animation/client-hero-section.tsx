"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { ShaderMaterial } from "./shader-material";
import { Sparkles } from "@react-three/drei";

const AnimatedIcosahedron = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const originalPositions = useRef<Float32Array | null>(null);

  const state = useRef({
    time: 0,
    baseScale: 1,
    maxScale: 1,
    currentScale: 1,
    progress: 0,
    isExpanding: true,
    holdTimer: 0,
    holdDuration: 1.5,
    isInitialized: false,
  }).current;

  // Initialize once
  useEffect(() => {
    if (state.isInitialized || !meshRef.current?.geometry.attributes.position)
      return;

    const positions = meshRef.current.geometry.attributes.position.array;
    originalPositions.current = new Float32Array(positions);

    state.maxScale = Math.max(viewport.width, viewport.height) * 1.5;
    state.baseScale = state.maxScale * 0.01;
    state.currentScale = state.baseScale;
    meshRef.current.scale.setScalar(state.baseScale);
    state.isInitialized = true;
  }, [viewport.width, viewport.height, state]);

  useFrame((_, delta) => {
    if (
      !meshRef.current?.geometry.attributes.position ||
      !originalPositions.current
    )
      return;

    state.time += delta * 0.6;

    const expansionSpeed = 0.06;
    const contractionSpeed = 0.05;

    // Animation cycle management
    if (state.isExpanding) {
      if (state.holdTimer > 0) {
        state.holdTimer -= delta;
      } else {
        state.progress = Math.min(state.progress + delta * expansionSpeed, 1);
        if (state.progress >= 1) {
          state.holdTimer = state.holdDuration;
        }
      }
    } else {
      state.progress = Math.max(state.progress - delta * contractionSpeed, 0);
      if (state.progress <= 0) {
        setTimeout(() => {
          state.isExpanding = true;
        }, 300);
      }
    }

    const positions = meshRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const origX = originalPositions.current[i] ?? 0;
      const origY = originalPositions.current[i + 1] ?? 0;
      const origZ = originalPositions.current[i + 2] ?? 0;

      const radius = Math.sqrt(origX ** 2 + origY ** 2 + origZ ** 2);
      const theta = Math.atan2(origY, origX);
      const phi = Math.acos(origZ / radius);

      const voidFreq = 1.2;
      const voidSpeed = 0.4;

      const depthWave =
        Math.sin(theta * voidFreq + state.time * voidSpeed) *
        Math.cos(phi * voidFreq + state.time * voidSpeed * 0.7) *
        Math.sin(radius * 2.0 + state.time * 0.3);

      const secondaryWave =
        Math.sin(phi * voidFreq * 0.8 + state.time * voidSpeed * 0.5) *
        Math.cos(theta * voidFreq * 0.8 + state.time * voidSpeed * 0.4);

      const depthEffect =
        (depthWave + secondaryWave) *
        state.progress *
        (0.8 + Math.sin(radius * 2.5 + state.time * 0.4));

      const displacement = Math.max(0, depthEffect) * 0.3;
      const totalDeformation = depthEffect * 0.2 * (1 + state.progress * 0.4);

      const normalizedPos = new THREE.Vector3(origX, origY, origZ).normalize();
      const deformAmount = 1 + totalDeformation + displacement;

      positions[i] =
        origX * deformAmount + normalizedPos.x * state.progress * 0.12;
      positions[i + 1] =
        origY * deformAmount + normalizedPos.y * state.progress * 0.12;
      positions[i + 2] =
        origZ * deformAmount + normalizedPos.z * state.progress * 0.12;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;

    const targetScale =
      state.baseScale +
      (state.maxScale - state.baseScale) * easeInOutCubic(state.progress);
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.015,
    );

    meshRef.current.rotation.x += delta * 0.06;
    meshRef.current.rotation.y += delta * 0.04;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <ShaderMaterial />
    </mesh>
  );
};

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const Scene = () => (
  <>
    <AnimatedIcosahedron />
    <Sparkles count={3000} scale={[20, 20, 10]} size={5} speed={1} />
  </>
);

const ClientHeroSection = () => (
  <section className="absolute -z-10 h-screen w-screen opacity-20">
    <Canvas
      camera={{ position: [0, 0, 2.5], fov: 75 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <Scene />
    </Canvas>
  </section>
);

export default ClientHeroSection;
