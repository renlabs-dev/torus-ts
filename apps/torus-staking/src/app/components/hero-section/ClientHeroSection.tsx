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

  const state = useRef({
    initialTime: Date.now(),
    baseScale: 1,
    maxScale: 1,
    currentScale: 1,
    rotationX: 0,
    rotationY: 0,
    positionZ: 0,
    progress: 0,
    isExpanding: true,
    holdTimer: 0,
    holdDuration: 2,
  }).current;

  // Initialize scales when viewport changes
  useEffect(() => {
    if (!meshRef.current) return;

    state.maxScale = Math.max(viewport.width, viewport.height) * 1.5;
    state.baseScale = state.maxScale * 0.01;

    if (!state.isExpanding && state.progress === 0) {
      state.currentScale = state.baseScale;
      meshRef.current.scale.setScalar(state.baseScale);
    }
  }, [viewport, state]);

  useFrame((three, delta) => {
    if (!meshRef.current) return;

    // Expansion/Contraction animation
    const expansionSpeed = 0.08;
    const contractionSpeed = 0.06;

    if (state.isExpanding) {
      if (state.holdTimer > 0) {
        state.holdTimer -= delta;
      } else {
        state.progress += delta * expansionSpeed;
        if (state.progress >= 1) {
          state.progress = 1;
          state.holdTimer = state.holdDuration;
        }
      }
    } else {
      state.progress -= delta * contractionSpeed;
      if (state.progress <= 0) {
        state.progress = 0;
        setTimeout(() => {
          state.isExpanding = true;
        }, 500);
      }
    }

    if (state.holdTimer <= 0 && state.progress >= 1) {
      state.isExpanding = false;
    }

    // Scale calculation with easing
    const easedProgress = easeInOutCubic(state.progress);
    const targetScale =
      state.baseScale + (state.maxScale - state.baseScale) * easedProgress;

    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.015,
    );

    // Mouse-based rotation
    const mouseX = three.mouse.x * viewport.width * 0.0002;
    const mouseY = three.mouse.y * viewport.height * 0.0002;

    state.rotationX = THREE.MathUtils.lerp(
      state.rotationX,
      state.rotationX + mouseY,
      0.03,
    );
    state.rotationY = THREE.MathUtils.lerp(
      state.rotationY,
      state.rotationY + mouseX,
      0.03,
    );

    meshRef.current.rotation.x = state.rotationX;
    meshRef.current.rotation.y = state.rotationY;

    // Floating animation
    const elapsedTime = (Date.now() - state.initialTime) / 1000;
    const targetZ = Math.sin(elapsedTime * 0.2) * 0.08;

    state.positionZ = THREE.MathUtils.lerp(state.positionZ, targetZ, 0.01);

    meshRef.current.position.z = state.positionZ;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <ShaderMaterial config={animationConfig} />
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
    <div className="absolute inset-0 z-10 flex flex-col items-center bg-gradient-to-b from-black/30 to-transparent">
      {/* APR Display with custom padding */}
      <div className="w-full pt-[53px]">
        <APRDisplay />
      </div>

      {/* Main content centered in remaining space */}
      <div className="flex flex-1 flex-col items-center justify-center gap-8">
        <h1 className="font-['Italiana'] text-7xl font-light tracking-[0.15em] text-white/90">
          TORUS STAKING
        </h1>
        <BalanceDisplay />
        <p className="font-['Inter'] text-sm font-light tracking-wider text-white/70">
          emission landscape is dynamic, APR might change quickly
        </p>
      </div>
    </div>
  </section>
);

export default ClientHeroSection;
