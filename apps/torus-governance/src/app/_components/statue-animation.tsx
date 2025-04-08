"use client";

import { CameraControls, Html, SoftShadows, useGLTF } from "@react-three/drei";
import { Canvas, extend, useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { RoundedPlaneGeometry } from "maath/geometry";
import type { JSX, ReactNode } from "react";
import React, { useRef } from "react";
import type { Group, SpotLight } from "three";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";

extend({ RoundedPlaneGeometry });

interface AnnotationProps {
  children: ReactNode;
  position: [number, number, number];
  [key: string]: unknown;
}

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
    Node_3: THREE.Mesh;
  };
  materials: {
    ["Scene_-_Root"]: THREE.MeshStandardMaterial;
  };
  animations: unknown[];
};

function Model(props: JSX.IntrinsicElements["group"]) {
  const group = useRef<Group>(null);
  const light = useRef<SpotLight>(null);
  const { nodes } = useGLTF("/graces-draco.glb") as unknown as GLTFResult;

  const meshLambertMaterial = new THREE.MeshLambertMaterial({
    color: "#404044",
  });

  useFrame((state, delta) => {
    if (group.current) {
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
    }

    if (light.current) {
      easing.damp3(
        light.current.position,
        [state.pointer.x * 12, 0, 8 + state.pointer.y * 4],
        0.2,
        delta,
      );
    }
  });

  return (
    <group ref={group} {...props}>
      <mesh
        castShadow
        receiveShadow
        // material={materials["Scene_-_Root"]}
        material={meshLambertMaterial}
        geometry={nodes.Node_3.geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.2}
        dispose={null}
      />
      <Annotation position={[1.75, 3, 2.5]}>
        Thalia <span style={{ fontSize: "1.5em" }}>🌗</span>
      </Annotation>
      <Annotation position={[-4.5, 3.6, -3]}>
        Euphrosyne <span style={{ fontSize: "1.5em" }}>🌖</span>
      </Annotation>
      <Annotation position={[1.5, 8, -3]}>
        <span style={{ fontSize: "1.5em" }}>🌕</span> Aglaia
      </Annotation>
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

useGLTF.preload("/graces-draco.glb");

function Annotation({ children, ...props }: AnnotationProps) {
  return (
    <Html
      {...props}
      transform
      occlude="blending"
      geometry={
        /** The geometry is optional, it allows you to use any shape.
         *  By default it would be a plane. We need round edges here ...
         @ts-expect-error - roundedPlaneGeometry is extended but TypeScript doesn't recognize it */
        <roundedPlaneGeometry args={[1.66, 0.47, 0.24]} />
      }
    >
      <div className="annotation" onClick={() => console.log(".")}>
        {children}
      </div>
    </Html>
  );
}
