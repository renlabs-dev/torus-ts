"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

interface ShaderMaterialProps {
  config: AnimationConfig;
}

type CustomUniforms = Record<string, THREE.IUniform<number>>;

export interface AnimationConfig {
  time: number;
  frequency: number;
  amplitude: number;
  density: number;
  strength: number;
  deepPurple: number;
}

export const ShaderMaterial = ({ config }: ShaderMaterialProps) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(() => {
    if (!materialRef.current) return;

    Object.entries(config).forEach(([key, value]) => {
      const uniformName = `u${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      const uniforms = materialRef.current?.uniforms as CustomUniforms;

      if (key !== "time" && uniforms[uniformName]) {
        const current = Number(uniforms[uniformName].value);
        const next = Number(value);

        uniforms[uniformName].value = THREE.MathUtils.lerp(current, next, 0.05);
      }
    });
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
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
