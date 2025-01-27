"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, Canvas } from "@react-three/fiber";
import { useAnimationConfig } from "./hooks/useAnimationConfig";
import { ShaderMaterial } from "./materials/ShaderMaterial";

const AnimatedIcosahedron = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();
  const animationConfig = useAnimationConfig();
  const animationState = useRef({
    isExpanding: true,
    progress: 0,
    baseScale: 1,
    maxScale: 0,
    holdTimer: 0,
    holdDuration: 2,
  });

  useEffect(() => {
    if (meshRef.current) {
      const maxScale = Math.max(viewport.width, viewport.height) * 1.5;
      animationState.current.maxScale = maxScale;
      animationState.current.baseScale = maxScale * 0.01;
      meshRef.current.scale.setScalar(animationState.current.baseScale);
    }
  }, [viewport]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const { isExpanding, baseScale, maxScale, holdDuration } =
      animationState.current;
    const expansionSpeed = 0.08;
    const contractionSpeed = 0.06;

    if (isExpanding) {
      if (animationState.current.holdTimer > 0) {
        animationState.current.holdTimer -= delta;
      } else {
        animationState.current.progress += delta * expansionSpeed;
        if (animationState.current.progress >= 1) {
          animationState.current.progress = 1;
          animationState.current.holdTimer = holdDuration;
        }
      }
    } else {
      animationState.current.progress -= delta * contractionSpeed;
      if (animationState.current.progress <= 0) {
        setTimeout(() => {
          animationState.current.isExpanding = true;
        }, 500);
        animationState.current.progress = 0;
      }
    }

    if (
      animationState.current.holdTimer <= 0 &&
      animationState.current.progress >= 1
    ) {
      animationState.current.isExpanding = false;
    }

    const progress = animationState.current.progress;
    const easedProgress = easeInOutCubic(progress);

    const currentScale = baseScale + (maxScale - baseScale) * easedProgress;

    meshRef.current.scale.lerp(
      new THREE.Vector3(currentScale, currentScale, currentScale),
      0.015
    );

    const mouseX = state.mouse.x * viewport.width * 0.0002;
    const mouseY = state.mouse.y * viewport.height * 0.0002;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      meshRef.current.rotation.x + mouseY,
      0.03
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      meshRef.current.rotation.y + mouseX,
      0.03
    );

    const depthMovement = Math.sin(state.clock.elapsedTime * 0.2) * 0.08;
    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      depthMovement,
      0.01
    );
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
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-black/30 to-transparent">
      <h1 className="mb-6 font-['Italiana'] text-7xl font-light tracking-[0.15em] text-white/90">
        DELEGATE YOUR POWER
      </h1>
      <p className="font-['Inter'] text-sm font-light tracking-wider text-white/70">
        emission landscape is dynamic, APR might change quickly
      </p>
    </div>
  </section>
);

export default ClientHeroSection;
