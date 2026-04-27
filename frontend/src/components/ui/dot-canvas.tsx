import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Uniforms = Record<string, { value: number[] | number[][] | number; type: string }>;

const ShaderMesh = ({ source, uniforms }: { source: string; uniforms: Uniforms }) => {
  const { size } = useThree();
  const ref = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const prepared: Record<string, { value: unknown }> = {};
    for (const k in uniforms) {
      const u = uniforms[k];
      if (u.type === "uniform1f")   prepared[k] = { value: u.value };
      else if (u.type === "uniform1i")  prepared[k] = { value: u.value };
      else if (u.type === "uniform1fv") prepared[k] = { value: u.value };
      else if (u.type === "uniform3fv") prepared[k] = {
        value: (u.value as number[][]).map((v) => new THREE.Vector3().fromArray(v)),
      };
    }
    prepared["u_time"]       = { value: 0 };
    prepared["u_resolution"] = { value: new THREE.Vector2(size.width * 2, size.height * 2) };

    return new THREE.ShaderMaterial({
      vertexShader: `
        precision mediump float;
        uniform vec2 u_resolution;
        out vec2 fragCoord;
        void main() {
          gl_Position = vec4(position.xy, 0.0, 1.0);
          fragCoord = (position.xy + vec2(1.0)) * 0.5 * u_resolution;
          fragCoord.y = u_resolution.y - fragCoord.y;
        }`,
      fragmentShader: source,
      uniforms: prepared as never,
      glslVersion: THREE.GLSL3,
      blending: THREE.CustomBlending,
      blendSrc: THREE.SrcAlphaFactor,
      blendDst: THREE.OneFactor,
    });
  }, [size.width, size.height, source, uniforms]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    (ref.current.material as THREE.ShaderMaterial).uniforms.u_time.value = clock.getElapsedTime();
  });

  return (
    <mesh ref={ref as never}>
      <planeGeometry args={[2, 2]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};

/**
 * Animated green dot-matrix canvas reveal.
 * reverse=false → dots sweep in from centre outward
 * reverse=true  → dots sweep out from edges inward (used on success)
 */
export function DotCanvas({ reverse = false }: { reverse?: boolean }) {
  const colors   = [[34, 197, 94], [22, 163, 74]] as number[][];
  const opacities = [0.04, 0.04, 0.08, 0.08, 0.12, 0.12, 0.2, 0.2, 0.35, 0.5];
  const totalSize = 22;
  const dotSize   = 2;

  const colorsArr = [colors[0], colors[0], colors[0], colors[1], colors[1], colors[1]];

  const uniforms: Uniforms = {
    u_colors:     { value: colorsArr.map((c) => [c[0] / 255, c[1] / 255, c[2] / 255]), type: "uniform3fv" },
    u_opacities:  { value: opacities, type: "uniform1fv" },
    u_total_size: { value: totalSize, type: "uniform1f" },
    u_dot_size:   { value: dotSize,   type: "uniform1f" },
    u_reverse:    { value: reverse ? 1 : 0, type: "uniform1i" },
  };

  const source = `
    precision mediump float;
    in vec2 fragCoord;
    uniform float u_time;
    uniform float u_opacities[10];
    uniform vec3 u_colors[6];
    uniform float u_total_size;
    uniform float u_dot_size;
    uniform vec2 u_resolution;
    uniform int u_reverse;
    out vec4 fragColor;

    float PHI = 1.61803398874989484820459;
    float random(vec2 xy) { return fract(tan(distance(xy * PHI, xy) * 0.5) * xy.x); }

    void main() {
      vec2 st = fragCoord.xy;
      st.x -= abs(floor((mod(u_resolution.x, u_total_size) - u_dot_size) * 0.5));
      st.y -= abs(floor((mod(u_resolution.y, u_total_size) - u_dot_size) * 0.5));

      float opacity = step(0.0, st.x) * step(0.0, st.y);
      vec2 st2 = vec2(int(st.x / u_total_size), int(st.y / u_total_size));

      float show_offset = random(st2);
      float rand = random(st2 * floor((u_time / 5.0) + show_offset + 5.0));
      opacity *= u_opacities[int(rand * 10.0)];
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.x / u_total_size));
      opacity *= 1.0 - step(u_dot_size / u_total_size, fract(st.y / u_total_size));

      vec3 color = u_colors[int(show_offset * 6.0)];

      vec2 center  = u_resolution / 2.0 / u_total_size;
      float dist   = distance(center, st2);
      float maxDist = distance(center, vec2(0.0));
      float speed  = 0.5;

      if (u_reverse == 1) {
        float off = (maxDist - dist) * 0.02 + random(st2 + 42.0) * 0.2;
        opacity *= 1.0 - step(off, u_time * speed);
      } else {
        float off = dist * 0.01 + random(st2) * 0.15;
        opacity *= step(off, u_time * speed);
      }

      fragColor = vec4(color, opacity);
      fragColor.rgb *= fragColor.a;
    }`;

  return (
    <Canvas className="absolute inset-0 h-full w-full" style={{ position: "absolute" }}>
      <ShaderMesh source={source} uniforms={uniforms} />
    </Canvas>
  );
}
