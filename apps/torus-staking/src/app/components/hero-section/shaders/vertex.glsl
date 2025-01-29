// vertex.glsl
#pragma glslify: pnoise = require(glsl-noise/periodic/3d)
#pragma glslify: rotateY = require(glsl-rotate/rotateY)

uniform float uFrequency;
uniform float uAmplitude;
uniform float uDensity;
uniform float uStrength;
uniform float uTime;

varying float vDistortion;
varying float vDepth;

void main() {
  float liquidNoise = pnoise(vec3(
    position.x * 2.0 + uTime * 0.5,
    position.y * 2.0 + uTime * 0.3,
    position.z * 2.0 + uTime * 0.4
  ), vec3(10.0)) * 0.3;

  float organicMove = pnoise(normal * uDensity + uTime * 0.1, vec3(10.)) * uStrength;
  float distortion = liquidNoise + organicMove;

  vec3 pos = position + (normal * distortion);

  // Modified depth calculation
  float distanceFromCenter = length(pos);
  vDepth = smoothstep(0.0, 2.0, distanceFromCenter);

  // Add wave-like movement
  float angle = sin(uv.y * uFrequency + uTime * 0.2) * uAmplitude;
  pos = rotateY(pos, angle);

  vDistortion = distortion;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
