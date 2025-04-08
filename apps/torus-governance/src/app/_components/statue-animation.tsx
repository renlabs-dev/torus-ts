"use client";

import { CameraControls, SoftShadows, useGLTF } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { RoundedPlaneGeometry } from "maath/geometry";
import type { JSX } from "react";
import React, { useRef } from "react";
import type * as THREE from "three";
import type { GLTF } from "three-stdlib";

extend({ RoundedPlaneGeometry });

export function StatueAnimation() {
  return (
    <Canvas
      shadows="basic"
      eventPrefix="client"
      camera={{ position: [0, 1.5, 14], fov: 45 }}
    >
      <fog attach="fog" args={["black", 0, 20]} />
      <pointLight position={[10, -10, -20]} intensity={10} />
      <pointLight position={[-10, -10, -20]} intensity={10} />
      <Model position={[0, -5.5, 3]} rotation={[0, -0.2, 0]} />
      <SoftShadows samples={3} />
      <CameraControls
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        minAzimuthAngle={-Math.PI / 2}
        maxAzimuthAngle={Math.PI / 2}
      />
    </Canvas>
  );
}

type GLTFResult = GLTF & {
  nodes: {
    Object_4: THREE.Mesh;
  };
  materials: {
    ["75-18_LOD1_u1_v1"]: THREE.MeshBasicMaterial;
  };
  animations: unknown[];
};

function Model(props: JSX.IntrinsicElements["group"]) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.SpotLight>(null);
  const { nodes } = useGLTF("/statue.glb") as unknown as GLTFResult;

  useFrame((state, delta) => {
    if (!group.current || !light.current) return;
    easing.dampE(
      group.current.rotation,
      [0, -state.pointer.x * (Math.PI / 10), 0],
      1.5,
      delta,
    );
    easing.damp3(
      group.current.position,
      [0, -5.5, 1 - Math.abs(state.pointer.x)],
      1,
      delta,
    );
    easing.damp3(
      light.current.position,
      [state.pointer.x * 12, 0, 8 + state.pointer.y * 4],
      0.2,
      delta,
    );
  });

  return (
    <group ref={group} {...props}>
      <mesh
        castShadow
        receiveShadow
        dispose={null}
        geometry={nodes.Object_4.geometry}
      >
        <meshLambertMaterial color="#404044" />
      </mesh>
      <spotLight
        angle={0.5}
        penumbra={0.5}
        ref={light}
        castShadow
        intensity={10}
        shadow-mapSize={1024}
        shadow-bias={-0.001}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-10, 10, -10, 10, 0.1, 50]}
        />
      </spotLight>
    </group>
  );
}
