import { useRef, useMemo, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 120;
const MAX_DISTANCE = 3.2;
const SPREAD_X = 14;
const SPREAD_Y = 8;
const SPREAD_Z = 5;

function NeuralNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Points>(null);

  // Generate random node positions and velocities
  const { positions, velocities, pulsePhases } = useMemo(() => {
    const pos = new Float32Array(NODE_COUNT * 3);
    const vel = new Float32Array(NODE_COUNT * 3);
    const phases = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD_X;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
      vel[i * 3] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.008;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.004;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, velocities: vel, pulsePhases: phases };
  }, []);

  // Pre-allocate line geometry (max possible connections)
  const maxLines = NODE_COUNT * 6;
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);
  const lineColors = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);

  // Node sizes for pulsing
  const sizes = useMemo(() => {
    const s = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) s[i] = 2.5 + Math.random() * 2;
    return s;
  }, []);

  const nodeColors = useMemo(() => {
    const c = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      // Rose palette variations
      const t = Math.random();
      c[i * 3] = 0.85 + t * 0.15;     // R
      c[i * 3 + 1] = 0.25 + t * 0.2;  // G
      c[i * 3 + 2] = 0.45 + t * 0.15; // B
    }
    return c;
  }, []);

  const glowSizes = useMemo(() => {
    const s = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) s[i] = 6 + Math.random() * 4;
    return s;
  }, []);

  // Shader materials for glowing points
  const pointMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          uniform float uTime;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.1, d);
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          varying vec3 vColor;
          void main() {
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.3, d) * 0.15;
            gl_FragColor = vec4(vColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pts = pointsRef.current;
    const glow = glowRef.current;
    const lines = linesRef.current;
    if (!pts || !lines || !glow) return;

    const posArr = pts.geometry.attributes.position.array as Float32Array;
    const sizeArr = pts.geometry.attributes.size.array as Float32Array;
    const glowPosArr = glow.geometry.attributes.position.array as Float32Array;

    // Move nodes and pulse sizes
    for (let i = 0; i < NODE_COUNT; i++) {
      const i3 = i * 3;
      posArr[i3] += velocities[i3];
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2];

      // Bounce
      if (Math.abs(posArr[i3]) > SPREAD_X / 2) velocities[i3] *= -1;
      if (Math.abs(posArr[i3 + 1]) > SPREAD_Y / 2) velocities[i3 + 1] *= -1;
      if (Math.abs(posArr[i3 + 2]) > SPREAD_Z / 2) velocities[i3 + 2] *= -1;

      // Pulse size like stars
      const pulse = Math.sin(t * 2.5 + pulsePhases[i]) * 0.5 + 0.5;
      sizeArr[i] = 2.0 + pulse * 3.0;

      // Sync glow
      glowPosArr[i3] = posArr[i3];
      glowPosArr[i3 + 1] = posArr[i3 + 1];
      glowPosArr[i3 + 2] = posArr[i3 + 2];
    }

    pts.geometry.attributes.position.needsUpdate = true;
    pts.geometry.attributes.size.needsUpdate = true;
    glow.geometry.attributes.position.needsUpdate = true;

    // Build connections
    let lineIdx = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dx = posArr[i * 3] - posArr[j * 3];
        const dy = posArr[i * 3 + 1] - posArr[j * 3 + 1];
        const dz = posArr[i * 3 + 2] - posArr[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < MAX_DISTANCE && lineIdx < maxLines) {
          const alpha = 1 - dist / MAX_DISTANCE;
          const li = lineIdx * 6;
          linePositions[li] = posArr[i * 3];
          linePositions[li + 1] = posArr[i * 3 + 1];
          linePositions[li + 2] = posArr[i * 3 + 2];
          linePositions[li + 3] = posArr[j * 3];
          linePositions[li + 4] = posArr[j * 3 + 1];
          linePositions[li + 5] = posArr[j * 3 + 2];
          // Rose color with distance-based alpha
          lineColors[li] = 0.91 * alpha;
          lineColors[li + 1] = 0.34 * alpha;
          lineColors[li + 2] = 0.48 * alpha;
          lineColors[li + 3] = 0.91 * alpha;
          lineColors[li + 4] = 0.34 * alpha;
          lineColors[li + 5] = 0.48 * alpha;
          lineIdx++;
        }
      }
    }

    // Zero out unused
    for (let i = lineIdx * 6; i < linePositions.length; i++) {
      linePositions[i] = 0;
      lineColors[i] = 0;
    }

    lines.geometry.attributes.position.needsUpdate = true;
    lines.geometry.attributes.color.needsUpdate = true;
    lines.geometry.setDrawRange(0, lineIdx * 2);
  });

  return (
    <>
      {/* Glow layer behind nodes */}
      <points ref={glowRef} material={glowMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={NODE_COUNT} array={positions.slice()} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={NODE_COUNT} array={glowSizes} itemSize={1} />
          <bufferAttribute attach="attributes-color" count={NODE_COUNT} array={nodeColors.slice()} itemSize={3} />
        </bufferGeometry>
      </points>

      {/* Nodes */}
      <points ref={pointsRef} material={pointMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={NODE_COUNT} array={positions.slice()} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={NODE_COUNT} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-color" count={NODE_COUNT} array={nodeColors} itemSize={3} />
        </bufferGeometry>
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={maxLines * 2} array={linePositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={maxLines * 2} array={lineColors} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </>
  );
}

export default function NeuralNetworkBackground() {
  return (
    <div className="absolute inset-0 z-0" style={{ background: "#0a0a0f" }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: false }}
        style={{ background: "transparent" }}
      >
        <NeuralNetwork />
      </Canvas>
    </div>
  );
}
