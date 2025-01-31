"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

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

    const t = (uniforms.uTime.value += delta);

    uniforms.uFrequency.value =
      Math.sin(t * 0.25) * 1 +
      Math.cos(t * 0.15) * 0.75 +
      Math.sin(t * 0.35) * 0.25 +
      0.5;
    uniforms.uAmplitude.value =
      Math.cos(t * 0.15) * 1 +
      Math.sin(t * 0.1) * 0.75 +
      Math.cos(t * 0.25) * 0.15 +
      0.5;
    uniforms.uDensity.value =
      Math.sin(t * 0.1) * 0.25 + Math.cos(t * 0.2) * 0.15 + 1.1;
    uniforms.uStrength.value =
      Math.abs(Math.sin(t * 0.1)) * 0.1 +
      Math.abs(Math.cos(t * 0.15)) * 0.05 +
      0.1;
    uniforms.uDeepPurple.value =
      (Math.sin(t * 0.05) * 0.25 + 0.25) * (Math.cos(t * 0.1) * 0.25 + 0.25);
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
