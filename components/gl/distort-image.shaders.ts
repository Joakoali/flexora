export const DISTORT_VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/** Ondulación elástica + leve separación RGB, proporcional a uHover (0..1). */
export const DISTORT_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform float uTime;
uniform float uHover;
uniform vec2 uPointer;
uniform vec2 uScale; // cover-fit: escala uv para no deformar la imagen

void main() {
  vec2 uv = (vUv - 0.5) * uScale + 0.5;
  vec2 d = uv - uPointer;
  float dist = length(d);
  float ripple = sin(dist * 18.0 - uTime * 3.0) * 0.012 * uHover * exp(-dist * 2.5);
  vec2 off = normalize(d + 1e-4) * ripple;
  float shift = 0.004 * uHover;
  float r = texture2D(uTexture, uv + off + vec2(shift, 0.0)).r;
  float g = texture2D(uTexture, uv + off).g;
  float b = texture2D(uTexture, uv + off - vec2(shift, 0.0)).b;
  gl_FragColor = vec4(r, g, b, 1.0);
}
`;
