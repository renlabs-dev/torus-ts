#pragma glslify: pnoise = require(glsl-noise/periodic/3d)
#pragma glslify: rotateY = require(glsl-rotate/rotateY)

uniform float uFrequency;
uniform float uAmplitude;
uniform float uDensity;
uniform float uStrength;

varying float vDistortion;

void main() {
  float distortion = pnoise(normal * uDensity, vec3(10.)) * uStrength;
  vec3 pos = position + (normal * distortion);
  float angle = sin(uv.y * uFrequency) * uAmplitude;
  pos = rotateY(pos, angle);
  vDistortion = distortion;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.);
}
