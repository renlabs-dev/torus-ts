"use client";

import type { JSX } from "react";
import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AsciiRenderer } from "@react-three/drei";
import type { Mesh } from "three";

export function TorusAnimation() {
  return (
    <Canvas className="canvas">
      <color attach="background" args={["black"]} />
      <spotLight
        position={[10, 10, 20]}
        angle={0.35}
        penumbra={1}
        intensity={1500}
      />
      <pointLight position={[10, -10, -60]} intensity={1000} />
      <Torus />
      <AsciiRenderer fgColor="white" bgColor="transparent" />
    </Canvas>
  );
}

function Torus(props: JSX.IntrinsicElements["mesh"]) {
  const ref = useRef<Mesh | null>(null);
  const viewport = useThree((state) => state.viewport);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x = ref.current.rotation.y += delta / 4;
  });

  return (
    <mesh
      scale={Math.min(viewport.width, viewport.height) / 5}
      {...props}
      ref={ref}
    >
      <torusGeometry args={[2, 0.7, 128, 32]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
}
