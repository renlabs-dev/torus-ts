"use client";

import { ShaderMaterial } from "./shader-material";
import { CameraShake, Sparkles } from "@react-three/drei";
import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface AnimationState {
  time: number;
  baseScale: number;
  maxScale: number;
  currentScale: number;
  progress: number;
  isInitialized: boolean;
  initialExpansionComplete: boolean;
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
    isInitialized: false,
    initialExpansionComplete: false,
  }).current;

  useEffect(() => {
    if (!meshRef.current || state.isInitialized) return;

    state.maxScale = Math.max(viewport.width, viewport.height) * 1.2; // Increased max scale
    state.baseScale = state.maxScale * 0.3;
    state.currentScale = state.baseScale;
    meshRef.current.scale.setScalar(state.baseScale);
    state.isInitialized = true;
  }, [viewport.width, viewport.height, state]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const animationSpeed = {
      time: 0.02, // Even slower time progression
      initialExpansion: 0.5, // Faster initial expansion
      rotation: 0.0008, // Much slower rotation
    };

    state.time += delta * animationSpeed.time;

    if (!state.initialExpansionComplete) {
      state.progress = Math.min(
        state.progress + delta * animationSpeed.initialExpansion,
        1,
      );

      if (state.progress >= 1) {
        state.initialExpansionComplete = true;
      }
    }

    const targetScale =
      state.baseScale +
      (state.maxScale - state.baseScale) * easeOutExpo(state.progress);

    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.003, // Even smoother transition
    );

    meshRef.current.rotation.x += delta * animationSpeed.rotation;
    meshRef.current.rotation.y += delta * animationSpeed.rotation;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 48]} />
      <ShaderMaterial />
    </mesh>
  );
};

const easeOutExpo = (x: number): number =>
  x === 1 ? 1 : 1 - Math.pow(2, -10 * x);

const ClientHeroSection = () => (
  <section className="animate-fade animate-delay-700 absolute -z-30 h-screen w-screen">
    <section className="h-screen w-screen opacity-20">
      <Canvas camera={{ position: [0, 0, 2.5], fov: 70 }}>
        <AnimatedIcosahedron />
        <Sparkles
          count={2000}
          scale={[15, 15, 8]}
          size={3}
          speed={0.004} // Even slower sparkle movement
          noise={0.02} // Minimal noise
        />
        <CameraShake
          maxYaw={0.002} // Minimal shake
          maxPitch={0.002}
          maxRoll={0.002}
          yawFrequency={0.003} // Very slow frequency
          pitchFrequency={0.003}
          rollFrequency={0.003}
          intensity={0.01}
          decayRate={0.85}
        />
      </Canvas>
    </section>
  </section>
);

export default ClientHeroSection;
