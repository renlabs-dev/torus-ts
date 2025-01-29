uniform float uOpacity;
uniform float uDeepPurple;
uniform float uTime;

varying float vDistortion;
varying float vDepth; // New varying for depth

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  float distort = vDistortion * 3.;

  // Use depth to affect brightness and opacity
  float depthFactor = smoothstep(-1.0, 1.0, vDepth);
  float opacity = mix(0.3, 1.0, depthFactor) * uOpacity;

  // Brighter for outer parts, darker for inner
  vec3 brightness = vec3(0.1 + depthFactor * 0.3);
  vec3 contrast = vec3(0.3);
  vec3 oscilation = vec3(0.5);
  vec3 phase = vec3(0.2);

  vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);

  // Apply depth-based color adjustment
  color *= (0.5 + depthFactor * 0.5);

  gl_FragColor = vec4(color, opacity);
}
