/* eslint-disable @typescript-eslint/no-unsafe-member-access */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import {
  Image,
  ScrollControls,
  useScroll,
  useTexture,
  Sparkles,
  Clouds,
  Cloud,
} from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { easing } from "maath";
import { useRef, useState } from "react";
import * as THREE from "three";
import "./util";

export const Animation = () => (
  <div className="margin-0 padding-0 bg-accent/60 box-border h-80 w-full overflow-hidden">
    <Canvas camera={{ position: [0, 0, 100], fov: 8 }}>
      <Clouds material={THREE.MeshBasicMaterial} position={[0, 0, -2]}>
        <Cloud segments={20} bounds={[10, 2, 2]} volume={10} color="#506396" />
        <Cloud seed={1} scale={2} volume={10} color="black" fade={100} />
      </Clouds>
      <fog attach="fog" args={["#000000", 8.5, 12]} />
      <ScrollControls pages={4} infinite>
        <Rig rotation={[0, 0, 0.15]}>
          <Carousel />
        </Rig>
        <Banner position={[0, -0.15, 0]} />
      </ScrollControls>
      <Sparkles count={2000} scale={[20, 20, 10]} size={2} speed={1} />
    </Canvas>
  </div>
);

function Rig(props) {
  const ref = useRef();
  const scroll = useScroll();
  useFrame((state, delta) => {
    ref.current.rotation.y = -scroll.offset * (Math.PI * 2); // Rotate contents
    state.events.update(); // Raycasts every frame rather than on pointer-move
    easing.damp3(
      state.camera.position,
      [-state.pointer.x * 2, state.pointer.y + 1.5, 10],
      0.3,
      delta,
    ); // Move camera
    state.camera.lookAt(0, 0, 0); // Look at center
  });
  return <group ref={ref} {...props} />;
}

function Carousel({ radius = 1.4, count = 8 }) {
  return Array.from({ length: count }, (_, i) => (
    <Card
      key={i}
      url={`/img${Math.floor(i % 10) + 1}_.jpg`}
      position={[
        Math.sin((i / count) * Math.PI * 2) * radius,
        0,
        Math.cos((i / count) * Math.PI * 2) * radius,
      ]}
      rotation={[0, Math.PI + (i / count) * Math.PI * 2, 0]}
    />
  ));
}

function Card({ url, ...props }) {
  const ref = useRef();
  const [hovered, hover] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  const pointerOver = (e) => (e.stopPropagation(), hover(true));
  const pointerOut = () => hover(false);
  useFrame((state, delta) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    easing.damp3(ref.current.scale, hovered ? 1.15 : 1, 0.1, delta);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    easing.damp(ref.current.material, "zoom", 1, 0.2, delta);
  });
  return (
    <Image
      ref={ref}
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      url={url}
      transparent
      side={THREE.DoubleSide}
      onPointerOver={pointerOver}
      opacity={0.95}
      onPointerOut={pointerOut}
      {...props}
    >
      <bentPlaneGeometry args={[0.1, 1, 1, 20, 20]} />
    </Image>
  );
}

function Banner(props) {
  const ref = useRef();
  const texture = useTexture("/banner_.png");
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  const scroll = useScroll();
  useFrame((state, delta) => {
    ref.current.material.time.value += Math.abs(scroll.delta) * 4;
    ref.current.material.map.offset.x += delta / 2;
  });
  return (
    <mesh ref={ref} {...props}>
      <cylinderGeometry args={[1.6, 1.6, 0.14, 128, 16, true]} />
      <meshSineMaterial
        map={texture}
        map-anisotropy={16}
        map-repeat={[30, 1]}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
