"use client";

import { CameraShake, OrbitControls, useFBO } from "@react-three/drei";
import { Canvas, createPortal, useFrame } from "@react-three/fiber";
import { forwardRef, useMemo, useRef, useState } from "react";
import * as THREE from "three";

// Helper function to generate sphere positions
function getPoint(
  v: THREE.Vector4,
  size: number,
  data: Float32Array,
  offset: number,
) {
  v.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1, 0);
  if (v.length() > 1) return getPoint(v, size, data, offset);
  return v.normalize().multiplyScalar(size).toArray(data, offset);
}

// Helper function to get a sphere of points
function getSphere(
  count: number,
  size: number,
  p = new THREE.Vector4(),
): Float32Array {
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i += 4) getPoint(p, size, data, i);
  return data;
}

interface SimulationUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  positions: THREE.IUniform<THREE.DataTexture>;
  uTime: THREE.IUniform<number>;
  uCurlFreq: THREE.IUniform<number>;
}

interface RenderUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  positions: THREE.IUniform<THREE.DataTexture | null>;
  uTime: THREE.IUniform<number>;
  uFocus: THREE.IUniform<number>;
  uFov: THREE.IUniform<number>;
  uBlur: THREE.IUniform<number>;
}

const simulationVertexShader = `
precision highp float;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const simulationFragmentShader = `
precision highp float;
uniform sampler2D positions;
uniform float uTime;
uniform float uCurlFreq;
varying vec2 vUv;

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

float cnoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return 2.2 * n_xyz;
}

float snoise(vec3 x) {
  return cnoise(x);
}

vec3 snoiseVec3(vec3 x) {
  float s  = snoise(vec3(x));
  float s1 = snoise(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
  float s2 = snoise(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
  vec3 c = vec3(s, s1, s2);
  return c;
}

vec3 curlNoise(vec3 p) {
  const float e = .1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 p_x0 = snoiseVec3(p - dx);
  vec3 p_x1 = snoiseVec3(p + dx);
  vec3 p_y0 = snoiseVec3(p - dy);
  vec3 p_y1 = snoiseVec3(p + dy);
  vec3 p_z0 = snoiseVec3(p - dz);
  vec3 p_z1 = snoiseVec3(p + dz);

  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

  const float divisor = 1.0 / (2.0 * e);
  return normalize(vec3(x, y, z) * divisor);
}

void main() {
  float t = uTime * 0.015;
  float wave = sin(uTime * 1.2) * 0.3 + 1.0;
  
  vec3 pos = texture2D(positions, vUv).rgb;
  vec3 curlPos = texture2D(positions, vUv).rgb;
  pos = curlNoise(pos * uCurlFreq + t);
  curlPos = curlNoise(curlPos * uCurlFreq + t);
  curlPos += curlNoise(curlPos * uCurlFreq * 2.0) * (0.2 * wave);
  curlPos += curlNoise(curlPos * uCurlFreq * 4.0) * (0.25 * wave);
  curlPos += curlNoise(curlPos * uCurlFreq * 8.0) * (0.125 * wave);
  curlPos += curlNoise(pos * uCurlFreq * 16.0) * (0.0625 * wave);
  gl_FragColor = vec4(mix(pos, curlPos, cnoise(pos + t) * wave * 0.7), 1.0);
}
`;

// Render vertex shader
const renderVertexShader = `
uniform sampler2D positions;
uniform float uTime;
uniform float uFocus;
uniform float uFov;
uniform float uBlur;
varying float vDistance;

void main() { 
  vec3 pos = texture2D(positions, position.xy).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  vDistance = abs(uFocus - -mvPosition.z);
  gl_PointSize = (step(1.0 - (1.0 / uFov), position.x)) * vDistance * uBlur * 2.0;
}
`;

// Render fragment shader
const renderFragmentShader = `
varying float vDistance;

void main() {
  vec2 cxy = 2.0 * gl_PointCoord - 1.0;
  if (dot(cxy, cxy) > 1.0) discard;
  gl_FragColor = vec4(vec3(1.0), (1.04 - clamp(vDistance * 1.5, 0.0, 1.0)));
}
`;

// Props interface
interface SphereAnimationProps {
  speed?: number;
  fov?: number;
  aperture?: number;
  focus?: number;
  curl?: number;
  size?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}

// Internal Particles component
type ParticlesProps = Required<
  Omit<SphereAnimationProps, "cameraPosition" | "cameraFov">
>;

const Particles = forwardRef<THREE.Points, ParticlesProps>(function Particles(
  { speed, fov, aperture, focus, curl, size },
  ref,
) {
  const simRef = useRef<THREE.ShaderMaterial | null>(null);
  const renderRef = useRef<THREE.ShaderMaterial | null>(null);

  // Set up FBO scene
  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(
    () => new THREE.OrthographicCamera(-1, 1, 1, -1, 1 / 2 ** 53, 1),
  );

  // Geometry data
  const [positions] = useState(
    () =>
      new Float32Array([
        -1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0,
      ]),
  );
  const [uvs] = useState(
    () => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]),
  );

  // FBO setup
  const target = useFBO(size, size, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  // Uniforms
  const simulationUniforms = useMemo<SimulationUniforms>(() => {
    const positionsTexture = new THREE.DataTexture(
      getSphere(size * size, 128),
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    positionsTexture.needsUpdate = true;

    return {
      positions: { value: positionsTexture },
      uTime: { value: 0 },
      uCurlFreq: { value: curl },
    };
  }, [size, curl]);

  const renderUniforms = useMemo<RenderUniforms>(
    () => ({
      positions: { value: null },
      uTime: { value: 0 },
      uFocus: { value: focus },
      uFov: { value: fov },
      uBlur: { value: (5.6 - aperture) * 9 },
    }),
    [focus, fov, aperture],
  );

  // Particle positions for rendering
  const particles = useMemo(() => {
    const length = size * size;
    const particles = new Float32Array(length * 3);
    for (let i = 0; i < length; i++) {
      const i3 = i * 3;
      particles[i3 + 0] = (i % size) / size;
      particles[i3 + 1] = i / size / size;
    }
    return particles;
  }, [size]);

  useFrame((state) => {
    // Render simulation to FBO
    state.gl.setRenderTarget(target);
    state.gl.clear();
    state.gl.render(scene, camera);
    state.gl.setRenderTarget(null);

    // Update simulation uniforms
    if (simRef.current) {
      const uTime = simRef.current.uniforms.uTime;
      const uCurlFreq = simRef.current.uniforms.uCurlFreq;
      if (uTime) {
        uTime.value = state.clock.elapsedTime * speed;
      }
      if (uCurlFreq && typeof uCurlFreq.value === "number") {
        uCurlFreq.value = THREE.MathUtils.lerp(uCurlFreq.value, curl, 0.1);
      }
    }

    // Update render uniforms
    if (renderRef.current) {
      const positions = renderRef.current.uniforms.positions;
      const uTime = renderRef.current.uniforms.uTime;
      const uFocus = renderRef.current.uniforms.uFocus;
      const uFov = renderRef.current.uniforms.uFov;
      const uBlur = renderRef.current.uniforms.uBlur;

      if (positions) {
        positions.value = target.texture;
      }
      if (uTime) {
        uTime.value = state.clock.elapsedTime;
      }
      if (uFocus && typeof uFocus.value === "number") {
        uFocus.value = THREE.MathUtils.lerp(uFocus.value, focus, 0.1);
      }
      if (uFov && typeof uFov.value === "number") {
        uFov.value = THREE.MathUtils.lerp(uFov.value, fov, 0.1);
      }
      if (uBlur && typeof uBlur.value === "number") {
        uBlur.value = THREE.MathUtils.lerp(
          uBlur.value,
          (5.6 - aperture) * 9,
          0.1,
        );
      }
    }
  });

  return (
    <>
      {/* Simulation mesh (renders to FBO) */}
      {createPortal(
        <mesh>
          <shaderMaterial
            ref={simRef}
            uniforms={simulationUniforms}
            vertexShader={simulationVertexShader}
            fragmentShader={simulationFragmentShader}
          />
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[positions, 3]}
            />
            <bufferAttribute attach="attributes-uv" args={[uvs, 2]} />
          </bufferGeometry>
        </mesh>,
        scene,
      )}

      {/* Render points */}
      <points ref={ref} position={[0, -0.07, 0]}>
        <shaderMaterial
          ref={renderRef}
          uniforms={renderUniforms}
          vertexShader={renderVertexShader}
          fragmentShader={renderFragmentShader}
          transparent
          blending={THREE.NormalBlending}
          depthWrite={false}
        />
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
      </points>
    </>
  );
});

export function SphereAnimation({
  speed = 0.4,
  fov = 45,
  aperture = 4,
  focus = 5,
  curl = 0.4,
  size = 512,
  cameraPosition = [0, 0, 6],
  cameraFov = 25,
}: SphereAnimationProps = {}) {
  const particlesRef = useRef<THREE.Points>(null);

  return (
    <Canvas
      shadows="basic"
      eventPrefix="client"
      camera={{ position: cameraPosition, fov: cameraFov }}
      className="min-h-full min-w-full"
    >
      <OrbitControls
        enablePan={false}
        enableDamping={true}
        makeDefault
        autoRotate
        autoRotateSpeed={0.05}
        zoomSpeed={0.1}
        dampingFactor={0.02}
      />
      <CameraShake
        yawFrequency={1}
        maxYaw={0.02}
        pitchFrequency={1}
        maxPitch={0.02}
        rollFrequency={0.5}
        maxRoll={0.2}
        intensity={0.05}
      />
      <Particles
        ref={particlesRef}
        speed={speed}
        fov={fov}
        aperture={aperture}
        focus={focus}
        curl={curl}
        size={size}
      />
    </Canvas>
  );
}

export default SphereAnimation;
