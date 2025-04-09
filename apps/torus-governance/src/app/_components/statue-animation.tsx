"use client";

import {
  CameraControls,
  Cloud,
  Clouds,
  Html,
  SoftShadows,
  useGLTF,
} from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { Button } from "@torus-ts/ui/components/button";
import { easing } from "maath";
import { RoundedPlaneGeometry } from "maath/geometry";
import type { JSX } from "react";
import React, { useRef } from "react";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

extend({ RoundedPlaneGeometry });

export function StatueAnimation() {
  return (
    <Canvas
      shadows="basic"
      eventPrefix="client"
      camera={{ position: [0, 1.5, 14], fov: 42 }}
    >
      <fog attach="fog" args={["black", 0, 20]} />
      <pointLight position={[10, -10, -20]} intensity={10} />
      <pointLight position={[-10, -10, -20]} intensity={10} />
      <Model position={[0, -2.5, 3]} rotation={[0, -0.2, 0]} />

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
    themis: THREE.Mesh;
  };
};

function Model(props: JSX.IntrinsicElements["group"]) {
  const group = useRef<THREE.Group | null>(null);
  const light = useRef<THREE.SpotLight | null>(null);
  const { nodes } = useGLTF("/themis.glb") as unknown as GLTFResult;

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
      [0, -1.5, 1 - Math.abs(state.pointer.x)],
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
        scale={0.06}
        dispose={null}
        geometry={nodes.themis.geometry}
        position={[0.409, -0.06, -1.618]}
        rotation={[Math.PI / 2, 0, -0.25]}
      >
        <meshLambertMaterial color="#404044" />
      </mesh>
      <Annotation position={[0.5, -1, 1]}>Whitelist Applications</Annotation>
      <Annotation position={[-2.4, 1.6, 0.6]}>DAO Portal</Annotation>
      <Annotation position={[1.5, 2, 0.1]}>Proposals</Annotation>
      <Clouds material={THREE.MeshBasicMaterial}>
        <Cloud seed={2} scale={2} volume={5} color="#575757" fade={100} />
      </Clouds>

      <spotLight
        angle={0.6}
        penumbra={0.5}
        ref={light}
        castShadow
        intensity={1800}
        shadow-mapSize={1024}
        shadow-bias={-0.0008}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-10, 10, -10, 10, 0.1, 50]}
        />
      </spotLight>
    </group>
  );
}

useGLTF.preload("/themis.glb");

interface AnnotationProps {
  position: THREE.Vector3 | [number, number, number];
  children: React.ReactNode;
}

function Annotation({ children, position }: AnnotationProps) {
  return (
    <Html position={position} transform>
      <Button
        size="sm"
        variant="outline"
        className="px-2 text-xs opacity-60"
        onClick={() => console.log(".")}
      >
        {children}
      </Button>
    </Html>
  );
}
