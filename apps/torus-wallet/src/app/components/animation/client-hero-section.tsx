"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { ShaderMaterial } from "./shader-material";
import { CameraShake, Sparkles } from "@react-three/drei";

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

const ClientHeroSection = () => (
  <section className="absolute -z-30 h-screen w-screen animate-fade animate-delay-700">
    <section className="h-screen w-screen opacity-25">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 75 }}>
        <AnimatedIcosahedron />
        <Sparkles count={4000} scale={[20, 20, 10]} size={5} speed={0.5} />
        <CameraShake
          maxYaw={0.1}
          maxPitch={0.5}
          maxRoll={0.5}
          yawFrequency={0.1}
          pitchFrequency={0.1}
          rollFrequency={0.1}
          intensity={0.7}
          decayRate={0.65}
        />
      </Canvas>
    </section>
  </section>
);

export default ClientHeroSection;
