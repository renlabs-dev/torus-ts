import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
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
}

export const ParticleSystem: React.FC<ParticleSystemProps> = ({
  count,
  bounds,
}) => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, () => ({
      time: Math.random() * 100,
      factor: 20 + Math.random() * 100,
      speed: 0.01 + Math.random() / 200,
      x: Math.random() * bounds - bounds / 2,
      y: Math.random() * bounds - bounds / 2,
      z: Math.random() * bounds - bounds / 2,
    }));
  }, [count, bounds]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const particlesRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (!particlesRef.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = particlesRef.current.geometry;
    const positionAttribute = geometry.getAttribute(
      "position",
    ) as THREE.BufferAttribute;

    particles.forEach((particle, i) => {
      const i3 = i * 3;
      positions[i3] =
        Math.sin(time * particle.speed + particle.factor) * particle.x;
      positions[i3 + 1] =
        Math.cos(time * particle.speed + particle.factor) * particle.y;
      positions[i3 + 2] =
        Math.sin(time * particle.speed + particle.factor) * particle.z;
    });

    positionAttribute.set(positions);
    positionAttribute.needsUpdate = true;
  });

  const initialPositions = useMemo(() => {
    const array = new Float32Array(count * 3);
    particles.forEach((particle, i) => {
      const i3 = i * 3;
      array[i3] = particle.x;
      array[i3 + 1] = particle.y;
      array[i3 + 2] = particle.z;
    });
    return array;
  }, [particles, count]);

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={initialPositions}
          itemSize={3}
          usage={THREE.DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color={COLORS.particles}
        transparent
        sizeAttenuation
      />
    </points>
  );
};
