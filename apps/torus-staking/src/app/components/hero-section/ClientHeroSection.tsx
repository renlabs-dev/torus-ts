"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { ParticleSystem } from "./ParticleSystem";
import { COLORS } from "./constants";
import { useDevicePixelRatio } from "../../hooks/useDevicePixelRatio";

const ClientHeroSection = () => {
  const dpr = useDevicePixelRatio();

  return (
    <section className="relative h-[40vh] w-full">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/background.webp')",
          backgroundPosition: "center 0%",
        }}
      >
        {/* Darkening Overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Three.js Canvas */}
      <div className="absolute inset-0">
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
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <h1 className="text-5xl font-bold text-white">STATS</h1>
      </div>
    </section>
  );
};

export default ClientHeroSection;
