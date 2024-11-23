"use client";

import type { FC } from "react";
import type { Mesh } from "three";
import * as React from "react";
import { useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Torus: FC = () => {
  const torusRef = useRef<Mesh>(null);

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 1.8 },
      speed: { value: 0.15 },
      torusRadius: { value: 0.53 },
      tubeRadius: { value: 0.49 },
      lineThickness: { value: 0.03 },
    }),
    [],
  );

  // Custom shader material
  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vPosition = position;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
        fragmentShader: `
  #define PI 3.1415926535897932384626433832795

  uniform float time;
  uniform float intensity;
  uniform float speed;
  uniform float lineThickness;
  uniform float torusRadius;
  uniform float tubeRadius;
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;

  // Function to create a line with smooth edges
  float createLine(float value, float width) {
    float halfWidth = width * 0.8;
    float wrappedValue = fract(value);
    float distFromCenter = abs(wrappedValue - 0.5);
    return smoothstep(halfWidth, 0.0, distFromCenter);
  }

  // Function to create noise for distortion
  float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }

  void main() {
    vec2 uv = vUv;
    float v = uv.y * PI;
    float u = uv.x * 3.0 * PI;

    // Create seamless blend at edges
    float seamBlendWidth = 0.02;
    float uSeamFactor = smoothstep(0.0, seamBlendWidth, uv.x) *
                        smoothstep(1.0, 1.0 - seamBlendWidth, uv.x);
    float vSeamFactor = smoothstep(0.0, seamBlendWidth, uv.y) *
                        smoothstep(1.0, 1.0 - seamBlendWidth, uv.y);

    // Add distortion to the lines
    float distortion = noise(uv * 10.0 + time * 0.1) * 0.1;
    
    // Create flowing lines with distortion
    float flowU = createLine(u * 8.0 + time * speed + distortion, lineThickness) * uSeamFactor;
    float flowV = createLine(v * 8.0 - time * speed + distortion, lineThickness) * vSeamFactor;

    float pattern = max(flowU, flowV);

    // Calculate distance from center of torus for glow effect
    vec3 torusCenter = vec3(torusRadius, 0.0, 0.0);
    float distFromCenter = length(vPosition - torusCenter) / tubeRadius;
    float glowStrength = 1.0 - smoothstep(0.0, 1.0, distFromCenter);

    vec3 lightBlue = vec3(0.2, 0.6, 1.2);
    float breath = 0.5 * sin(time * 0.25) + 0.5;
    float pulseIntensity = 0.25 * sin(time * 0.1) + 0.75;

    float dimFactor = mix(0.6, 1.05, breath);
    float glowFactor = mix(0.7, 1.0, pulseIntensity);

    // Apply glow effect
    vec3 dimmedColor = lightBlue * dimFactor * glowFactor;
    vec3 glowColor = vec3(0.3, 0.6, 1.0) * glowStrength * 0.5;

    float baseOpacity = mix(0.07, 0.1, breath);
    float lineOpacity = pattern * intensity * mix(1.8, 2.85, pulseIntensity);

    // Smoother transition for opacity
    float finalOpacity = smoothstep(0.0, 0.8, (baseOpacity + lineOpacity) * 0.75);

    // Combine colors
    vec3 finalColor = dimmedColor + pattern * vec3(0.1, 0.2, 0.3) * pulseIntensity + glowColor;

    gl_FragColor = vec4(finalColor, finalOpacity);
  }
`,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useFrame(() => {
    const torus = torusRef.current;
    if (!torus) return;

    uniforms.time.value += 0.05;
  });

  return (
    <mesh ref={torusRef} scale={[1.8, 1.8, 1.8]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry
        args={[uniforms.torusRadius.value, uniforms.tubeRadius.value, 600, 600]}
      />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
};

export function TorusObject() {
  return (
    <Canvas
      camera={{
        fov: 75,
        near: 0.1,
        far: 1000,
        position: [0, 0, 3],
      }}
    >
      <Torus />
      <OrbitControls />
    </Canvas>
  );
}
