"use client";

import { useRef, useMemo, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COLORS } from "./constants";

interface ParticleSystemProps {
  count: number;
  bounds: number;
}

interface Particle {
  time: number;
  factor: number;
  speed: number;
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  originalZ: number;
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  count,
  bounds,
}) => {
  const [hovered, setHovered] = useState(false);
  const mouse = useRef<[number, number]>([0, 0]);
  const { viewport } = useThree();

  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, () => {
      const x = Math.random() * bounds - bounds / 2;
      const y = Math.random() * bounds - bounds / 2;
      const z = Math.random() * bounds - bounds / 2;
      return {
        time: Math.random() * 100,
        factor: 20 + Math.random() * 100,
        speed: 0.003 + Math.random() / 200,
        x,
        y,
        z,
        originalX: x,
        originalY: y,
        originalZ: z,
      };
    });
  }, [count, bounds]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const colors = useMemo(() => new Float32Array(count * 3), [count]);
  const particlesRef = useRef<THREE.Points>(null);

  // Initialize colors
  useMemo(() => {
    particles.forEach((_, i) => {
      const i3 = i * 3;
      // Mix between purple and white
      const mixFactor = Math.random();
      colors[i3] = mixFactor * 0.8 + 0.2; // R
      colors[i3 + 1] = mixFactor * 0.5 + 0.5; // G
      colors[i3 + 2] = mixFactor * 1.0; // B
    });
  }, [colors, particles]);

  useFrame((state) => {
    if (!particlesRef.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = particlesRef.current.geometry;
    const positionAttribute = geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;

    particles.forEach((particle, i) => {
      const i3 = i * 3;

      // Base movement
      let x = Math.sin(time * particle.speed + particle.factor) * particle.x;
      let y = Math.cos(time * particle.speed + particle.factor) * particle.y;
      let z = Math.sin(time * particle.speed + particle.factor) * particle.z;

      // Add hover effect
      if (hovered) {
        const dx = x - mouse.current[0];
        const dy = y - mouse.current[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repelForce = Math.max(0, 1 - dist / 2);

        x += (dx / dist) * repelForce * 0.5;
        y += (dy / dist) * repelForce * 0.5;
        z += Math.sin(time * 2) * 0.1;
      }

      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    });

    positionAttribute.set(positions);
    positionAttribute.needsUpdate = true;
  });

  return (
    <points
      ref={particlesRef}
      onPointerMove={(e) => {
        mouse.current = [
          (e.clientX / window.innerWidth) * 2 - 1,
          -(e.clientY / window.innerHeight) * 2 + 1,
        ];
        setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
