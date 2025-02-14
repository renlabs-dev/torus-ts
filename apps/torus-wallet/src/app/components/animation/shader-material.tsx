"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo,useRef } from "react";
import * as THREE from "three";

import fragmentShader from "./shaders/fragment.glsl";
import vertexShader from "./shaders/vertex.glsl";

export const ShaderMaterial = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uFrequency: { value: 0.5 },
      uAmplitude: { value: 0.5 },
      uDensity: { value: 1 },
      uStrength: { value: 0.1 },
      uDeepPurple: { value: 0 },
      uOpacity: { value: 0.5 },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    const t = (uniforms.uTime.value += delta * 0.25); // Slower time progression

    uniforms.uFrequency.value =
      Math.sin(t * 0.1) * 0.5 +
      Math.cos(t * 0.05) * 0.25 +
      Math.sin(t * 0.15) * 0.15 +
      0.5;
    uniforms.uAmplitude.value =
      Math.cos(t * 0.05) * 0.5 +
      Math.sin(t * 0.04) * 0.25 +
      Math.cos(t * 0.1) * 0.1 +
      0.5;
    uniforms.uDensity.value =
      Math.sin(t * 0.04) * 0.15 + Math.cos(t * 0.08) * 0.1 + 1.1;
    uniforms.uStrength.value =
      Math.abs(Math.sin(t * 0.04)) * 0.08 +
      Math.abs(Math.cos(t * 0.06)) * 0.03 +
      0.1;
    uniforms.uDeepPurple.value =
      (Math.sin(t * 0.02) * 0.15 + 0.25) * (Math.cos(t * 0.04) * 0.15 + 0.25);
  });

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={vertexShader}
      fragmentShader={fragmentShader}
      wireframe
      transparent
      blending={THREE.AdditiveBlending}
      uniforms={uniforms}
    />
  );
};
