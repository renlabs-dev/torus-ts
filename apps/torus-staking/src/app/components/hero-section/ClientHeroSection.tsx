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

  useEffect(() => {
    if (meshRef.current) {
      const scale = Math.max(viewport.width, viewport.height) * 1.5;
      meshRef.current.scale.set(scale, scale, scale);
    }
  }, [viewport]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Enhanced interactive rotation
    const mouseX = state.mouse.x * viewport.width * 0.001;
    const mouseY = state.mouse.y * viewport.height * 0.001;

    meshRef.current.rotation.x += delta * 0.05 + mouseY * 0.02;
    meshRef.current.rotation.y += delta * 0.1 + mouseX * 0.02;

    // Enhanced breathing effect
    const breathingScale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    meshRef.current.scale.multiplyScalar(breathingScale);
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1, 64]} />
      <ShaderMaterial config={animationConfig} />
    </mesh>
  );
};

const ParticleField = () => {
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    particlesRef.current.rotation.y += delta * 0.05;
  });

  const particleCount = 1000;
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }

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

const Scene = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <AnimatedIcosahedron />
      <ParticleField />
    </>
  );
};

const ClientHeroSection = () => {
  return (
    <section className="relative h-[40vh] w-full">
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0, 2.5], fov: 75 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Scene />
      </Canvas>
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-black/30 to-transparent">
        <h1 className="text-6xl font-bold tracking-wider text-white">STATS</h1>
      </div>
    </section>
  );
};

export default ClientHeroSection;
