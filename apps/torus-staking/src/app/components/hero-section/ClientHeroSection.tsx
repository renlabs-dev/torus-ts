"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { useAnimationConfig } from "./hooks/useAnimationConfig";
import { ShaderMaterial } from "./materials/ShaderMaterial";
import { BalanceDisplay } from "./BalanceDisplay";

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
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  return positions;
};

const ParticleField = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 1000;
  const positions = createParticlePositions(particleCount);

  useFrame((_, delta) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffffff"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
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
  <section className="relative h-[40vh] w-full">
    <Canvas
      className="absolute inset-0"
      camera={{ position: [0, 0, 2.5], fov: 75 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <Scene />
    </Canvas>
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-black/30 to-transparent">
      <h1 className="font-['Italiana'] text-7xl font-light tracking-[0.15em] text-white/90">
        TORUS STAKING
      </h1>
      <BalanceDisplay />
      <p className="font-['Inter'] text-sm font-light tracking-wider text-white/70">
        emission landscape is dynamic, APR might change quickly
      </p>
    </div>
  </section>
);

export default ClientHeroSection;
