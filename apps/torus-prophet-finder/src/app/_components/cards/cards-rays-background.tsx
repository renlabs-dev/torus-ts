"use client";

import * as React from "react";
import * as THREE from "three";
import { Figure } from "~/app/_components/cards/effects/figure";
import { LightSource } from "~/app/_components/cards/effects/light-source";
import {
  EffectComposer,
  EffectPass,
  GodRaysEffect,
  RenderPass,
} from "postprocessing";

function initCamera(w: number, h: number) {
  const cam = new THREE.PerspectiveCamera(60, w / h, 1, 1000);
  // Center camera on the scene so the object aligns with page center
  cam.position.set(0, 0, 20);
  return cam;
}

function initRenderer(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    powerPreference: "high-performance",
    antialias: false,
    stencil: false,
    depth: false,
  });
  // Opaque black clear to match original look and provide a clean base for rays
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  return renderer;
}

function addContent(scene: THREE.Scene) {
  // Group the system so we can offset it towards the header while
  // the canvas spans the entire cards section.
  const system = new THREE.Group();
  // Position upward so it sits visually behind the title block
  system.position.y = 10; // tuned for FOV=60, cam.z=20

  const light = new LightSource();
  // Center the source inside the hole and set depth behind the mask
  light.position.set(0, 0, -20);
  system.add(light);

  const figure = new Figure();
  system.add(figure);

  scene.add(system);
  return { light, figure, system };
}

function startAnimation(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  light: LightSource,
  composer: EffectComposer,
) {
  const clock = new THREE.Clock();
  let raf = 0;
  const tick = () => {
    const t = clock.getElapsedTime();
    light.userData.time.value = t;
    // Keep the source fixed at the center of the hole for stable rays
    composer.render();
    raf = window.requestAnimationFrame(tick);
  };
  raf = window.requestAnimationFrame(tick);
  return () => window.cancelAnimationFrame(raf);
}

function createScene(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  const camera = initCamera(canvas.clientWidth, canvas.clientHeight);
  const renderer = initRenderer(canvas);
  const { light } = addContent(scene);

  // Postprocessing: Render + God Rays
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Restore baseline parameters that produced the correct look
  const gre = new GodRaysEffect(camera, light as any, {
    height: 480,
    kernelSize: 2,
    density: 1,
    decay: 0.9,
    weight: 0.5,
    exposure: 0.3,
    samples: 20,
    clampMax: 0.95,
  });
  composer.addPass(new EffectPass(camera, gre));

  const stop = startAnimation(renderer, scene, camera, light, composer);

  const handleResize = () => {
    const { clientWidth, clientHeight } = canvas;
    if (clientWidth === 0 || clientHeight === 0) return;
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(clientWidth, clientHeight, false);
    composer.setSize(clientWidth, clientHeight);
  };
  window.addEventListener("resize", handleResize);

  return {
    dispose() {
      stop();
      window.removeEventListener("resize", handleResize);
      scene.traverse((obj) => {
        const m = (obj as any).material as THREE.Material | undefined;
        const g = (obj as any).geometry as THREE.BufferGeometry | undefined;
        if (m) m.dispose?.();
        if (g) g.dispose?.();
      });
      composer.dispose();
      renderer.dispose();
    },
  };
}

export default function CardsRaysBackground() {
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const controller = createScene(canvas);
    return () => controller.dispose();
  }, []);

  // Absolute across full section, above starfield, below content
  return (
    <div className="pointer-events-none absolute inset-0 z-[12]">
      <canvas className="h-full w-full" ref={ref} />
    </div>
  );
}
