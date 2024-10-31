/* eslint-disable @typescript-eslint/no-non-null-assertion */
"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import linesFragmentShader from "./shaders/lines/fragment.glsl";
import pointsFragmentShader from "./shaders/points/fragment.glsl";
import pointsVertexShader from "./shaders/points/vertex.glsl";

const getRandNum = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

function CreateAnimation({ container }: { container: HTMLElement }) {
  const canvas = document.createElement("canvas");
  canvas.classList.add("webgl");
  container.appendChild(canvas);

  const isMobile = window.innerWidth <= 768;

  const sizes = {
    width: container.clientWidth,
    height: container.clientHeight,
  };

  const clock = new THREE.Clock();

  const object = {
    tubeRadius: 4.1,
    torusRadius: 5.3,
    radialSegments: 30,
    tabularSegments: 60,
  };

  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let objectsGroup: THREE.Group;

  function init() {
    createScene();
    createCamera();
    createRenderer();
    createControls();
    createObjects();
    playIntroAnimation();

    window.addEventListener("resize", onWindowResize);

    tick();
  }

  function createObjects() {
    const points = createPoints();
    const lines = createLines(points.geometry);

    objectsGroup = new THREE.Group();
    objectsGroup.add(points);
    objectsGroup.add(lines);
    objectsGroup.rotation.x = -Math.PI * (isMobile ? 0.35 : 0.36);
    objectsGroup.position.y = isMobile ? 2.4 : 1.75;
    scene.add(objectsGroup);
  }

  function createLines(pointsGeometry: THREE.BufferGeometry) {
    // Access pointsGeometry attributes
    const positions = pointsGeometry.attributes.position!.array;
    const colors = pointsGeometry.attributes.color!.array;
    const normals = pointsGeometry.attributes.normal!.array;

    const linePositions: unknown[] = [];
    const lineColors: unknown[] = [];
    const lineNormals: unknown[] = [];
    const lineOpacity: unknown[] = [];

    const addLine = (vertexIndex1: number, vertexIndex2: number) => {
      const baseIndex1 = vertexIndex1 * 3;
      const baseIndex2 = vertexIndex2 * 3;

      linePositions.push(
        positions[baseIndex1],
        positions[baseIndex1 + 1],
        positions[baseIndex1 + 2],
        positions[baseIndex2],
        positions[baseIndex2 + 1],
        positions[baseIndex2 + 2],
      );

      lineColors.push(
        colors[baseIndex1],
        colors[baseIndex1 + 1],
        colors[baseIndex1 + 2],
        colors[baseIndex2],
        colors[baseIndex2 + 1],
        colors[baseIndex2 + 2],
      );
      lineNormals.push(
        normals[baseIndex1],
        normals[baseIndex1 + 1],
        normals[baseIndex1 + 2],
        normals[baseIndex2],
        normals[baseIndex2 + 1],
        normals[baseIndex2 + 2],
      );

      const [oMin, oMax] = [0.01, 0.2];

      lineOpacity.push(getRandNum(oMin, oMax), getRandNum(oMin, oMax));
    };

    // Randomly connect each vertex with up to 2 random neighbors that follow it in the array
    const numVertices = positions.length / 3;
    for (let i = 0; i < numVertices; i++) {
      const numConnections = Math.floor(Math.random() * 3); // Random number of connections (0, 1, or 2)
      const possibleConnections: unknown[] = [];

      // Find possible connections
      for (let j = i + 1; j < numVertices / 2; j++) {
        possibleConnections.push(j);
      }

      // Shuffle possible connections to randomize which vertices are selected
      for (let k = possibleConnections.length - 1; k > 0; k--) {
        const index = Math.floor(Math.random() * (k + 1));
        [possibleConnections[k], possibleConnections[index]] = [
          possibleConnections[index],
          possibleConnections[k],
        ];
      }

      // Add line positions for the selected number of connections
      for (
        let m = 0;
        m < numConnections && m < possibleConnections.length;
        m++
      ) {
        addLine(i, possibleConnections[m] as number);
      }
    }

    const lineGeometry = new THREE.BufferGeometry();

    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(linePositions as number[]), 3),
    );

    lineGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(lineColors as number[]), 3),
    );

    lineGeometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(lineNormals as number[]), 3),
    );

    lineGeometry.setAttribute(
      "aOpacity",
      new THREE.BufferAttribute(new Float32Array(lineOpacity as number[]), 1),
    );

    const { torusRadius, tubeRadius } = object;

    const lineMaterial = new THREE.ShaderMaterial({
      vertexShader: pointsVertexShader,
      fragmentShader: linesFragmentShader,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uColorOpacity: { value: 0 },
        uTime: { value: 0 },
        uWeight: { value: 0 },
        uTorusRadius: { value: torusRadius },
        uTubeRadius: { value: tubeRadius },
      },
    });

    const lines = new THREE.Line(lineGeometry, lineMaterial);
    return lines;
  }

  function createPoints() {
    const { torusRadius, tubeRadius } = object;
    const fixedPointCount = 10000; // Adjust this number as needed

    const positions = [];
    const colors = [];
    const scales = [];
    const normals = [];

    for (let i = 0; i < fixedPointCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 2;

      const x = (torusRadius + tubeRadius * Math.cos(phi)) * Math.cos(theta);
      const y = (torusRadius + tubeRadius * Math.cos(phi)) * Math.sin(theta);
      const z = tubeRadius * Math.sin(phi);

      positions.push(x, y, z);

      const normalizedPos =
        (y + torusRadius + tubeRadius) / ((torusRadius + tubeRadius) * 2);
      const r = 0.05 + normalizedPos * 0.15; // Very low red for a cool, dark tone
      const g = 0.1 + normalizedPos * 0.2; // Low green for subtle teal tints
      const b = 0.3 + normalizedPos * 0.4; // Moderate to high blue, but darker overall

      colors.push(r, g, b);
      scales.push(getRandNum(0.5, 3));

      // Calculate normals
      const nx = Math.cos(theta) * Math.cos(phi);
      const ny = Math.sin(theta) * Math.cos(phi);
      const nz = Math.sin(phi);
      normals.push(nx, ny, nz);
    }

    const customGeometry = new THREE.BufferGeometry();

    customGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    customGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );
    customGeometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals, 3),
    );
    customGeometry.setAttribute(
      "aScale",
      new THREE.Float32BufferAttribute(scales, 1),
    );

    const torusMaterial = new THREE.ShaderMaterial({
      vertexShader: pointsVertexShader,
      fragmentShader: pointsFragmentShader,
      wireframe: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,

      uniforms: {
        uColorOpacity: { value: 1.0 },
        uTime: { value: 0 },
        uWeight: { value: 0 },
        uTorusRadius: { value: torusRadius },
        uTubeRadius: { value: tubeRadius },
      },
    });
    const points = new THREE.Points(customGeometry, torusMaterial);
    return points;
  }

  function createScene() {
    scene = new THREE.Scene();
  }

  const fov = isMobile ? 70 : 58;
  const cameraRotation = isMobile ? 12 : 1;

  function createCamera() {
    camera = new THREE.PerspectiveCamera(
      fov,
      sizes.width / sizes.height,
      0.1,
      200,
    );
    camera.position.set(0, cameraRotation + 10, 20);
    scene.add(camera);
  }

  function createRenderer() {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function createControls() {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.enableZoom = false;
    controls.enableRotate = false;
  }

  function onWindowResize() {
    sizes.width = container.clientWidth;
    sizes.height = container.clientHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
  }

  function tick() {
    const elapsedTime = clock.getElapsedTime() * 0.25;

    objectsGroup.children.forEach((child) => {
      if (
        "material" in child &&
        child.material instanceof THREE.ShaderMaterial
      ) {
        child.material.uniforms.uTime!.value = elapsedTime;
        child.material.uniforms.uWeight!.value =
          0.05 * Math.sin(elapsedTime) + 0.8;
      }
    });

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);

    // Call tick again on the next frame
    window.requestAnimationFrame(() => tick());
  }

  function playIntroAnimation() {
    camera.position.set(0, 0, 5);

    const finalPosition = new THREE.Vector3(0, 1, 19);

    const tl = gsap.timeline();

    tl.to(camera.position, {
      duration: 3,
      x: finalPosition.x,
      y: finalPosition.y,
      z: finalPosition.z,
      ease: "power2.out",
      onUpdate: function () {
        camera.lookAt(objectsGroup.position);
      },
    });

    tl.fromTo(
      scene,
      { opacity: 0 },
      { opacity: 1, duration: 2, ease: "power2.inOut" },
      "-=2",
    );
  }

  init();
}

export default function Animation() {
  const graphRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (graphRef.current) {
      CreateAnimation({ container: graphRef.current });
    }
  }, []);

  return (
    <div
      id="graph"
      ref={graphRef}
      className="absolute top-0 -z-10 h-full w-full opacity-80"
      style={{ overflow: "hidden" }}
    />
  );
}
