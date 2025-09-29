"use client";

import * as React from "react";
import * as THREE from "three";
import { LightSource } from "~/app/_components/cards/effects/light-source";
import { Figure } from "~/app/_components/cards/effects/figure";
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

function addContent(
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
) {
  // Group the system so we can offset it towards the header while
  // the canvas spans the entire cards section.
  const system = new THREE.Group();
  // Align the hole to a screen-pixel offset below the section top
  const ch = canvas.clientHeight || window.innerHeight;
  const fovRad = THREE.MathUtils.degToRad(camera.fov);
  const hWorld = 2 * camera.position.z * Math.tan(fovRad / 2);
  const pxToWorld = hWorld / ch;
  const offsetPxFromTop = Math.min(96, Math.max(48, ch * 0.12)); // ~12% down
  const worldY = (ch / 2 - offsetPxFromTop) * pxToWorld;
  system.position.set(0, worldY, 0);

  const light = new LightSource();
  // Place the emitter slightly behind origin for postprocessing
  light.position.set(0, 0, -20);
  system.add(light);

  // Add the figure as an invisible occluder to localize rays
  const figure = new Figure();
  const mat = (figure as any).material as THREE.MeshBasicMaterial | undefined;
  if (mat) {
    mat.color.set(0x000000); // match clear color
    mat.transparent = true;
    mat.opacity = 0; // invisible in color buffer
    mat.depthWrite = true; // still occludes
    mat.colorWrite = false; // don't touch color buffer
  }
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
  const { light, system } = addContent(scene, camera, canvas);

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
    // Re-align hole to keep placement relative to section top
    const fovRad = THREE.MathUtils.degToRad(camera.fov);
    const hWorld = 2 * camera.position.z * Math.tan(fovRad / 2);
    const pxToWorld = hWorld / clientHeight;
    const offsetPxFromTop = Math.min(96, Math.max(48, clientHeight * 0.12));
    const worldY = (clientHeight / 2 - offsetPxFromTop) * pxToWorld;
    system.position.set(0, worldY, 0);
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

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // Absolute across full section, above starfield, below content
  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-x-0 top-0 z-[12] w-full"
      style={{ height: `${1900}px` }}
    >
      <canvas className="h-full w-full" ref={ref} />
    </div>
  );
}


