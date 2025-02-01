"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { ShaderMaterial } from "./shader-material";
import { CameraShake, Sparkles } from "@react-three/drei";

interface AnimationState {
  time: number;
  baseScale: number;
  maxScale: number;
  currentScale: number;
  progress: number;
  isExpanding: boolean;
  holdTimer: number;
  holdDuration: number;
  isInitialized: boolean;
}

const AnimatedIcosahedron = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  const state = useRef<AnimationState>({
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

  useEffect(() => {
    if (!meshRef.current || state.isInitialized) return;

    state.maxScale = Math.max(viewport.width, viewport.height) * 1.5;
    state.baseScale = state.maxScale * 0.01;
    state.currentScale = state.baseScale;
    meshRef.current.scale.setScalar(state.baseScale);
    state.isInitialized = true;
  }, [viewport.width, viewport.height, state]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const animationSpeed = {
      time: 0.2,
      expansion: 0.04,
      contraction: 0.03,
      rotation: 0.01,
    };

    state.time += delta * animationSpeed.time;

    if (state.isExpanding) {
      if (state.holdTimer > 0) {
        state.holdTimer -= delta;
      } else {
        state.progress = Math.min(
          state.progress + delta * animationSpeed.expansion,
          1,
        );
        if (state.progress >= 1) {
          state.holdTimer = state.holdDuration;
        }
      }
    } else {
      state.progress = Math.max(
        state.progress - delta * animationSpeed.contraction,
        0,
      );
      if (state.progress <= 0) {
        setTimeout(() => {
          state.isExpanding = true;
        }, 2000);
      }
    }

    const targetScale =
      state.baseScale +
      (state.maxScale - state.baseScale) * easeInOutCubic(state.progress);

    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.01,
    );

    meshRef.current.rotation.x += delta * animationSpeed.rotation;
    meshRef.current.rotation.y += delta * animationSpeed.rotation;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <ShaderMaterial />
    </mesh>
  );
};

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

const ClientHeroSection = () => (
  <section className="absolute -z-30 h-screen w-screen animate-fade animate-delay-700">
    <section className="h-screen w-screen opacity-25">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 75 }}>
        <AnimatedIcosahedron />
        <Sparkles
          count={3500}
          scale={[20, 20, 10]}
          size={4}
          speed={0.05}
          noise={0.1}
        />
        <CameraShake
          maxYaw={0.03}
          maxPitch={0.03}
          maxRoll={0.03}
          yawFrequency={0.03}
          pitchFrequency={0.03}
          rollFrequency={0.03}
          intensity={0.1}
          decayRate={0.65}
        />
      </Canvas>
    </section>
  </section>
);

export default ClientHeroSection;
