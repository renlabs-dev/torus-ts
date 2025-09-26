"use client";

import { useFrame, useLoader, useThree } from "@react-three/fiber";
import {
  fragmentShader,
  vertexShader,
} from "~/app/_components/hero/StormShaders";
import * as React from "react";
import { useMemo, useRef } from "react";
import * as THREE from "three";

interface Uniforms {
  u_time: { value: number };
  u_resolution: { value: THREE.Vector2 };
  u_noise: { value: THREE.Texture };
  u_bg: { value: THREE.Texture };
  u_mouse: { value: THREE.Vector2 };
  u_scroll: { value: number };
  u_offset: { value: THREE.Vector2 };
}

export default function StormQuad() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, gl } = useThree();

  const [noiseTex, bgTex] = useLoader(
    THREE.TextureLoader,
    [
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png",
      "https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/clouds-1-tile.jpg",
    ],
    (loader: THREE.Loader) => {
      const tl = loader as unknown as THREE.TextureLoader & {
        crossOrigin?: string;
      };
      tl.crossOrigin = "anonymous";
    },
  ) as [THREE.Texture, THREE.Texture];

  React.useEffect(() => {
    [noiseTex, bgTex].forEach((t) => {
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.minFilter = THREE.LinearFilter;
      t.needsUpdate = true;
    });
  }, [noiseTex, bgTex]);

  const uniforms: Uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2() },
      u_noise: { value: noiseTex },
      u_bg: { value: bgTex },
      u_mouse: { value: new THREE.Vector2() },
      u_scroll: { value: 0 },
      u_offset: { value: new THREE.Vector2() },
    }),
    [noiseTex, bgTex],
  );

  const uniformsRef = React.useRef<Uniforms>(uniforms);
  React.useEffect(() => {
    uniformsRef.current = uniforms;
  }, [uniforms]);

  React.useEffect(() => {
    function updateResAndOffset() {
      const u = uniformsRef.current;
      const dpr = gl.getPixelRatio();
      u.u_resolution.value.set(
        window.innerWidth * dpr,
        window.innerHeight * dpr,
      );
      const rect = gl.domElement.getBoundingClientRect();
      u.u_offset.value.set(rect.left * dpr, rect.top * dpr);
    }
    updateResAndOffset();
    window.addEventListener("resize", updateResAndOffset);
    window.addEventListener("scroll", updateResAndOffset, { passive: true });
    return () => {
      window.removeEventListener("resize", updateResAndOffset);
      window.removeEventListener("scroll", updateResAndOffset);
    };
  }, [gl]);

  React.useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      const u = uniformsRef.current;
      const ratio = size.height / size.width;
      u.u_mouse.value.x = (e.clientX - size.width / 2) / size.width / ratio;
      u.u_mouse.value.y = ((e.clientY - size.height / 2) / size.height) * -1;
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [size.width, size.height]);

  useFrame(() => {
    const u = uniformsRef.current;
    u.u_time.value = -1000 + performance.now() * 0.0005;
    u.u_scroll.value = window.scrollY || 0;
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        args={[{ uniforms, vertexShader, fragmentShader }]}
        glslVersion={THREE.GLSL1}
      />
    </mesh>
  );
}
