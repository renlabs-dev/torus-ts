"use client";

import type { FC } from "react";
import type { Mesh } from "three";
import * as React from "react";
import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const Torus: FC = () => {
  const torusRef = useRef<Mesh>(null);

  // Create uniforms
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 0.5 },
      speed: { value: 0.15 },
      torusRadius: { value: 0.53 },
      tubeRadius: { value: 0.49 },
      lineThickness: { value: 0.02 },
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
          varying vec2 vUv;

          float createLine(float value, float width) {
            float halfWidth = width * 0.5;
            float wrappedValue = fract(value);
            float distFromCenter = abs(wrappedValue - 0.5);
            return smoothstep(halfWidth, 0.0, distFromCenter);
          }

          void main() {
            vec2 uv = vUv;
            float v = uv.y * PI;
            float u = uv.x * 2.0 * PI;

            float seamBlendWidth = 0.05;
            float uSeamFactor = smoothstep(0.0, seamBlendWidth, uv.x) *
                                smoothstep(1.0, 1.0 - seamBlendWidth, uv.x);
            float vSeamFactor = smoothstep(0.0, seamBlendWidth, uv.y) *
                                smoothstep(1.0, 1.0 - seamBlendWidth, uv.y);

            float flowU = createLine(u * 8.0 + time * speed, lineThickness) * uSeamFactor;
            float flowV = createLine(v * 8.0 - time * speed, lineThickness) * vSeamFactor;

            float pattern = max(flowU, flowV);

            vec3 lightBlue = vec3(0.2, 0.6, 1.0);
            float breath = 0.5 * sin(time * 0.25) + 0.5;
            float pulseIntensity = 0.25 * sin(time * 0.1) + 0.75;

            float dimFactor = mix(0.6, 1.05, breath);
            float glowFactor = mix(0.7, 1.0, pulseIntensity);

            vec3 dimmedColor = lightBlue * dimFactor * glowFactor;

            float baseOpacity = mix(0.07, 0.1, breath);
            float lineOpacity = pattern * intensity * mix(1.4, 1.85, pulseIntensity);

            // Smoother transition for opacity
            float finalOpacity = smoothstep(0.0, 0.8, (baseOpacity + lineOpacity) * 0.75);

            vec3 finalColor = dimmedColor + pattern * vec3(0.1, 0.2, 0.3) * pulseIntensity;

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
    <mesh ref={torusRef} scale={[1.6, 1.6, 1.6]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry
        args={[uniforms.torusRadius.value, uniforms.tubeRadius.value, 400, 400]}
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
    </Canvas>
  );
}
