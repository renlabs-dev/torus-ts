"use client";

import type { FC } from "react";
import type { Mesh } from "three";
import { useMemo, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform float speed;
  uniform float lineThickness;
  varying vec2 vUv;

  const float PI = 3.1415926535897932384626433832795;

  float createLine(float value, float width) {
    float halfWidth = width * 0.2;
    float wrappedValue = fract(value);
    return smoothstep(0.0, halfWidth, abs(wrappedValue - 0.5)) -
      smoothstep(halfWidth, halfWidth + fwidth(value), abs(wrappedValue - 0.5));
  }

  void main() {
    vec2 uv = vUv;
    float u = uv.x * 1.5 * PI;
    float v = fract(uv.y + 0.5) * PI;

    float smoothSize = 0.20;

    float seamFactor =
      1.0
      // * smoothstep(0.0, 0.05, uv.x)
      // * smoothstep(1.0, 0.95, uv.x)
      // * smoothstep(0.0, 0.05, uv.y)
      // * smoothstep(1.0, 0.95, uv.y)
      // * smoothstep(0.5-smoothSize, 0.5+smoothSize, uv.y)
    ;

    float flowU = createLine(u * 8.0 + time * speed, lineThickness) * seamFactor;
    float flowV = createLine(v * 8.0 - time * speed, lineThickness) * seamFactor;

    float pattern = max(flowU, flowV);

    vec3 lightBlue = vec3(0.2, 0.6, 1.0);
    float pulse = sin(time * 0.1) * 0.25 + 0.75;

    vec3 finalColor = lightBlue;
    float finalOpacity = pattern * intensity * pulse;

    gl_FragColor = vec4(finalColor, finalOpacity);
  }
`;

const Torus: FC = () => {
  const torusRef = useRef<Mesh>(null);

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 12 },
      speed: { value: 0.1 },
      lineThickness: { value: 0.01 },
    }),
    [],
  );

  const shaderMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    [uniforms],
  );

  useFrame(() => {
    if (torusRef.current) {
      uniforms.time.value += 0.05;
    }
  });

  return (
    <mesh ref={torusRef} scale={[1.8, 1.8, 1.8]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.53, 0.49, 600, 600]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
};

export const TorusObject: FC = () => (
  <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 3] }}>
    <Torus />
    <OrbitControls />
  </Canvas>
);
