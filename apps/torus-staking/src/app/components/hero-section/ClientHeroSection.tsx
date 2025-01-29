"use client";

import { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { useAnimationConfig } from "./hooks/useAnimationConfig";
import { ShaderMaterial } from "./materials/ShaderMaterial";
import { BalanceDisplay } from "./BalanceDisplay";
import { APRDisplay } from "../apr-display";

const AnimatedIcosahedron = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const animationConfig = useAnimationConfig();
  const originalPositions = useRef<Float32Array>();

  const state = useRef({
    time: 0,
    baseScale: 1,
    maxScale: 1,
    currentScale: 1,
    progress: 0,
    isExpanding: true,
    holdTimer: 0,
    holdDuration: 1.5,
  }).current;

  useEffect(() => {
    if (!meshRef.current?.geometry.attributes.position) return;

    const positions = meshRef.current.geometry.attributes.position.array;
    originalPositions.current = new Float32Array(positions);

    state.maxScale = Math.max(viewport.width, viewport.height) * 1.5;
    state.baseScale = state.maxScale * 0.01;
    state.currentScale = state.baseScale;
    meshRef.current.scale.setScalar(state.baseScale);
  }, [viewport]);

  useFrame((_, delta) => {
    if (
      !meshRef.current?.geometry.attributes.position ||
      !originalPositions.current
    )
      return;

    state.time += delta * 0.6; // Slowed down the overall animation

    const expansionSpeed = 0.06; // Slower expansion
    const contractionSpeed = 0.05; // Slower contraction

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

    if (state.holdTimer <= 0 && state.progress >= 1) {
      state.isExpanding = false;
    }

    const positions = meshRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < positions.length; i += 3) {
      const origX = originalPositions.current[i];
      const origY = originalPositions.current[i + 1];
      const origZ = originalPositions.current[i + 2];

      // Calculate radius and angles for depth effect
      const radius = Math.sqrt(origX * origX + origY * origY + origZ * origZ);
      const theta = Math.atan2(origY, origX);
      const phi = Math.acos(origZ / radius);

      // Modified wave parameters for smoother deformation
      const voidFreq = 1.2;
      const voidSpeed = 0.4;

      // Layered wave deformation
      const depthWave =
        Math.sin(theta * voidFreq + state.time * voidSpeed) *
        Math.cos(phi * voidFreq + state.time * voidSpeed * 0.7) *
        Math.sin(radius * 2.0 + state.time * 0.3);

      const secondaryWave =
        Math.sin(phi * voidFreq * 0.8 + state.time * voidSpeed * 0.5) *
        Math.cos(theta * voidFreq * 0.8 + state.time * voidSpeed * 0.4);

      // Combined deformation effect
      const depthEffect =
        (depthWave + secondaryWave) *
        state.progress *
        (0.8 + Math.sin(radius * 2.5 + state.time * 0.4));

      // Smooth vertex displacement
      const displacement = Math.max(0, depthEffect) * 0.3;
      const totalDeformation = depthEffect * 0.2 * (1 + state.progress * 0.4);

      // Calculate normalized position for consistent deformation
      const normalizedPos = new THREE.Vector3(origX, origY, origZ).normalize();
      const deformAmount = 1 + totalDeformation + displacement;

      // Apply deformation
      positions[i] =
        origX * deformAmount + normalizedPos.x * state.progress * 0.12;
      positions[i + 1] =
        origY * deformAmount + normalizedPos.y * state.progress * 0.12;
      positions[i + 2] =
        origZ * deformAmount + normalizedPos.z * state.progress * 0.12;
    }

    // Update geometry and apply smooth scaling
    meshRef.current.geometry.attributes.position.needsUpdate = true;
    const targetScale =
      state.baseScale +
      (state.maxScale - state.baseScale) * easeInOutCubic(state.progress);

    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.015,
    );

    // Smooth rotation
    meshRef.current.rotation.x += delta * 0.06;
    meshRef.current.rotation.y += delta * 0.04;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <ShaderMaterial
        config={{
          ...animationConfig,
          uOpacity: Math.max(0.8 - state.progress * 0.3, 0.4), // Higher opacity range
          uStrength: 0.15 + state.progress * 0.3,
        }}
      />
    </mesh>
  );
};

const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const createParticlePositions = (count: number) => {
  const positions = new Float32Array(count * 3);
  const spread = 30; // Increased spread for more distributed stars

  for (let i = 0; i < count; i++) {
    // Random distribution with more variance
    positions[i * 3] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spread;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  return positions;
};

const ParticleField = () => {
  const createStarTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Sharper, brighter gradient
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.4, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.8, "rgba(255, 255, 255, 0.3)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);

    return new THREE.CanvasTexture(canvas);
  };
  // Hooks first
  const particlesRef = useRef<THREE.Points>(null);
  const texture = useMemo(() => createStarTexture(), []);

  const MAX_PARTICLE_SIZE = 0.15;

  // Constants and calculations after hooks
  const particleCount = 5000;
  const positions = useMemo(
    () => createParticlePositions(particleCount),
    [particleCount],
  );
  const sizes = useMemo(() => {
    const sizeArray = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Keep the original random calculation but cap it at MAX_PARTICLE_SIZE
      sizeArray[i] = Math.min(Math.random() * 0.15 + 0.05, MAX_PARTICLE_SIZE);
    }
    return sizeArray;
  }, [particleCount]);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.02;
    }
  });

  if (!texture) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        sizeAttenuation={true}
        transparent={true}
        opacity={1}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={texture}
        alphaMap={texture}
        color="#ffffff"
      />
    </points>
  );
};

const Scene = () => (
  <>
    <ambientLight intensity={0.5} />
    <pointLight position={[10, 10, 10]} intensity={1} />
    <AnimatedIcosahedron />
    <ParticleField />
  </>
);

const ClientHeroSection = () => (
  <section className="relative h-[40vh] w-screen">
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 2.5], fov: 75 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <Scene />
    </Canvas>
    <div className="absolute inset-0 z-10 flex flex-col items-center bg-gradient-to-b from-black/30 via-transparent to-black/60">
      <div className="w-full pt-[53px]">
        <APRDisplay />
      </div>
      {/* Main content centered in remaining space */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <h1 className="font-['Syncopate'] text-7xl font-light tracking-[0.15em] text-white/90">
          TORUS STAKING
        </h1>
        <BalanceDisplay />
        <p className="font-['Inter'] text-sm font-light tracking-wider text-white/70">
          Emission landscape is dynamic, APR might change quickly.
        </p>
      </div>
    </div>
  </section>
);

export default ClientHeroSection;
