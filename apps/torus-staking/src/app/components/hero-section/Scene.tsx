"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ParticleSystem } from "./ParticleSystem";
import { COLORS } from "./constants";
import { useDevicePixelRatio } from "../../hooks/useDevicePixelRatio";

const Scene = () => {
  const dpr = useDevicePixelRatio();

  return (
    <Canvas
      camera={{
        position: [0, 2, 4],
        fov: 75,
        near: 0.1,
        far: 100,
      }}
      dpr={dpr}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(COLORS.background), 0);
      }}
    >
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <ParticleSystem count={1500} bounds={12} />
    </Canvas>
  );
};

export default Scene;
