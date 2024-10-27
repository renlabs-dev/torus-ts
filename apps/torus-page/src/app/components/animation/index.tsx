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

  const sizes = {
    width: container.clientWidth,
    height: container.clientHeight,
  };
  const clock = new THREE.Clock();

  const object = {
    tubeRadius: 4,
    torusRadius: 4.5,
    radialSegments: 50,
    tabularSegments: 100,
    yPosition: 2.5,
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
    objectsGroup.rotation.x =
      -Math.PI * (window.innerWidth <= 768 ? 0.25 : 0.35);
    objectsGroup.position.y = window.innerWidth <= 768 ? 7.5 : 2.5;
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
      wireframe: false,
      depthWrite: false,
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
    const { torusRadius, tubeRadius, radialSegments, tabularSegments } = object;

    const torusGeometry = new THREE.TorusGeometry(
      torusRadius,
      tubeRadius,
      radialSegments,
      tabularSegments,
    );

    torusGeometry.computeVertexNormals();

    // Copy the positions from the TorusGeometry
    const positions = torusGeometry.attributes.position!.array;
    const normals = torusGeometry.attributes.normal!.array;
    const maxPosition = Math.max(...positions);
    const minPosition = Math.min(...positions);

    const customGeometry = new THREE.BufferGeometry();

    const colors = [];
    const scales = [];

    for (let i = 0; i < positions.length; i += 3) {
      // Normalize the position value between 0 and 1
      const normalizedPos =
        (positions[i]! - minPosition) / (maxPosition - minPosition);

      // Adjust these values to create a more purple-blush color, ensuring no black points
      const r = normalizedPos * 1; // Range from 0.5 to 1.0
      const g = normalizedPos * 0.5; // Range from 0.2 to 0.5
      const b = normalizedPos * 2; // Range from 0.5 to 1.0

      colors.push(r, g, b * 2);
      scales.push(getRandNum(0.5, 3));
    }

    customGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(positions), 3),
    );

    customGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(new Float32Array(colors), 3),
    );

    customGeometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(normals), 3),
    );
    customGeometry.setAttribute(
      "aScale",
      new THREE.BufferAttribute(new Float32Array(scales), 1),
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

  const fov = window.innerWidth <= 768 ? 90 : 60;
  const cameraRotation = window.innerWidth <= 768 ? 12 : 1;

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

    const finalPosition = new THREE.Vector3(0, 1, 20);

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
      className="fixed left-0 top-0 -z-50 h-full w-full"
      style={{ overflow: "hidden" }}
    />
  );
}
