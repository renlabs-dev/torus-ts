uniform float uOpacity;
uniform float uDeepPurple;

varying float vDistortion;

vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  float distort = vDistortion * 3.;

  // Updated color parameters for monochrome look
  vec3 brightness = vec3(0.1, 0.1, 0.1);    // Reduced color variation
  vec3 contrast = vec3(0.3, 0.3, 0.3);      // Kept neutral
  vec3 oscilation = vec3(0.5, 0.5, 0.5);    // Made uniform for all channels
  vec3 phase = vec3(0.2, 0.2, 0.2);         // Reduced color separation

  vec3 color = cosPalette(distort, brightness, contrast, oscilation, phase);
  gl_FragColor = vec4(color, vDistortion);

  // Removed purple tint, replaced with neutral gray
  gl_FragColor += vec4(0.1, 0.1, 0.1, min(uOpacity, 1.));
}
