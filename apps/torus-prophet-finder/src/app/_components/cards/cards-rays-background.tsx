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
  cam.position.set(5, 0, 20);
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
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  return renderer;
}

function addContent(scene: THREE.Scene) {
  const light = new LightSource();
  light.position.set(2, 0, -10);
  scene.add(light);
  const figure = new Figure();
  scene.add(figure);
  return { light, figure };
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
    light.position.x = Math.cos(t) * 4;
    light.position.y = Math.sin(t * 0.6) * 4;
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

  // Absolute, behind starfield (z-[5]), keep black backdrop
  return (
    <div className="pointer-events-none absolute inset-0 z-[5]">
      <canvas className="h-full w-full" ref={ref} />
    </div>
  );
}

