export const FLEX_FIELD_VERTEX = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

/**
 * Campo elástico: fbm con domain warping. El puntero "tira" del campo
 * como un dedo sobre una tela: desplaza las coordenadas hacia sí con
 * caída gaussiana. uIntensity calibra oscuro (1.0) vs claro (0.55).
 */
export const FLEX_FIELD_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uPointer;        // 0..1, origen abajo-izquierda
uniform float uPointerForce;  // 0..1, suavizado en JS
uniform vec3 uAccent;
uniform vec3 uBg;
uniform float uIntensity;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + 10.0;
    a *= 0.5;
  }
  return v;
}

void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(vUv.x * aspect, vUv.y);
  vec2 pointer = vec2(uPointer.x * aspect, uPointer.y);

  // Tirón elástico hacia el puntero.
  vec2 d = p - pointer;
  float dist2 = dot(d, d);
  float pull = exp(-dist2 * 5.0) * uPointerForce;
  p -= d * pull * 0.6;

  // Domain warping lento.
  float t = uTime * 0.04;
  vec2 q = vec2(fbm(p * 1.4 + t), fbm(p * 1.4 - t + 3.7));
  float n = fbm(p * 1.8 + q * 1.6 + t * 0.5);

  // Bandas de luz: una zona clara ancha y un borde más fino.
  float band = smoothstep(0.42, 0.78, n);
  float edge = smoothstep(0.55, 0.62, n) * (1.0 - smoothstep(0.62, 0.70, n));
  float light = clamp(band * 0.85 + edge * 0.6 + pull * 0.35, 0.0, 1.0) * uIntensity;

  // Viñeta suave hacia los bordes para que el campo no corte seco.
  vec2 v = vUv * 2.0 - 1.0;
  float vignette = 1.0 - smoothstep(0.55, 1.25, dot(v, v));

  vec3 col = mix(uBg, uAccent, light * vignette);
  gl_FragColor = vec4(col, 1.0);
}
`;
