import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { AnimationConfig } from "../types/animation";
import vertexShader from "../shaders/vertex.glsl";
import fragmentShader from "../shaders/fragment.glsl";

interface ShaderMaterialProps {
  config: AnimationConfig;
}

export const ShaderMaterial = ({ config }: ShaderMaterialProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (!materialRef.current) return;

    Object.entries(config).forEach(([key, value]) => {
      const uniformName = `u${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      if (key !== "time" && materialRef.current?.uniforms[uniformName]) {
        const current = materialRef.current.uniforms[uniformName].value;
        const next = value;
        // Smoother interpolation
        materialRef.current.uniforms[uniformName].value = THREE.MathUtils.lerp(
          current,
          next,
          0.05,
        );
      }
    });
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader as string}
      fragmentShader={fragmentShader as string}
      wireframe
      transparent
      blending={THREE.AdditiveBlending}
      uniforms={{
        uFrequency: { value: 0 },
        uAmplitude: { value: 0 },
        uDensity: { value: 0 },
        uStrength: { value: 0 },
        uDeepPurple: { value: 0 },
        uOpacity: { value: 0.5 },
        uTime: { value: 0 },
      }}
    />
  );
};
