uniform float uOpacity;
uniform float uDeepPurple;
uniform float uTime;

varying float vDistortion;
varying float vDepth;

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  float distort = vDistortion * 3.;

  // Adjust depth mapping to be more gradual
  float depthFactor = smoothstep(-1.0, 1.0, vDepth * 0.5);

  // Increased opacity range
  float opacity = mix(0.1, 0.6, depthFactor) * uOpacity;

  // Increased brightness values
  vec3 brightness = vec3(0.3 + depthFactor * 0.4); // Higher base brightness
  vec3 contrast = vec3(0.4); // Increased contrast
  vec3 oscilation = vec3(0.5);
  vec3 phase = vec3(0.2);

  vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);

  // Lighter depth-based adjustment
  color *= (0.6 + depthFactor * 0.4);

  // More subtle density adjustment
  float densityFactor = smoothstep(0.8, 1.0, vDepth);
  opacity *= (1.0 - densityFactor * 0.3); // Reduced opacity reduction

  gl_FragColor = vec4(color, opacity);
}
