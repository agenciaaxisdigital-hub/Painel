import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 60;
const MAX_DISTANCE = 2.8;
const SPREAD_X = 12;
const SPREAD_Y = 7;
const SPREAD_Z = 4;

function NeuralNetwork() {
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const glowRef = useRef<THREE.Points>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Track mouse for parallax
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const { positions, velocities, pulsePhases } = useMemo(() => {
    const pos = new Float32Array(NODE_COUNT * 3);
    const vel = new Float32Array(NODE_COUNT * 3);
    const phases = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * SPREAD_X;
      pos[i * 3 + 1] = (Math.random() - 0.5) * SPREAD_Y;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
      vel[i * 3] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.003;
      phases[i] = Math.random() * Math.PI * 2;
    }
    return { positions: pos, velocities: vel, pulsePhases: phases };
  }, []);

  const maxLines = NODE_COUNT * 4;
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);
  const lineColors = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);

  const sizes = useMemo(() => {
    const s = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) s[i] = 3 + Math.random() * 2;
    return s;
  }, []);

  const nodeColors = useMemo(() => {
    const c = new Float32Array(NODE_COUNT * 3);
    for (let i = 0; i < NODE_COUNT; i++) {
      const t = Math.random();
      c[i * 3] = 0.85 + t * 0.15;
      c[i * 3 + 1] = 0.25 + t * 0.2;
      c[i * 3 + 2] = 0.45 + t * 0.15;
    }
    return c;
  }, []);

  const glowSizes = useMemo(() => {
    const s = new Float32Array(NODE_COUNT);
    for (let i = 0; i < NODE_COUNT; i++) s[i] = 10 + Math.random() * 8;
    return s;
  }, []);

  // Pulse signal tracking — when nodes connect, they "fire"
  const fireTimes = useMemo(() => new Float32Array(NODE_COUNT).fill(-10), []);

  const pointMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: `
          attribute float size;
          attribute vec3 color;
          attribute float fireTime;
          uniform float uTime;
          varying vec3 vColor;
          varying float vFire;
          void main() {
            float fireDelta = uTime - fireTime;
            vFire = fireDelta < 1.0 ? (1.0 - fireDelta) : 0.0;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float fireBoost = 1.0 + vFire * 2.0;
            gl_PointSize = size * fireBoost * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vFire;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float alpha = smoothstep(0.5, 0.05, d);
            vec3 fireColor = mix(vColor, vec3(1.0, 0.9, 0.95), vFire * 0.8);
            float fireAlpha = alpha * (1.0 + vFire * 1.5);
            gl_FragColor = vec4(fireColor, min(fireAlpha, 1.0));
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
          attribute float fireTime;
          uniform float uTime;
          varying vec3 vColor;
          varying float vFire;
          void main() {
            float fireDelta = uTime - fireTime;
            vFire = fireDelta < 1.5 ? (1.0 - fireDelta / 1.5) : 0.0;
            vColor = color;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            float fireBoost = 1.0 + vFire * 3.0;
            gl_PointSize = size * fireBoost * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vFire;
          void main() {
            float d = length(gl_PointCoord - vec2(0.5));
            if (d > 0.5) discard;
            float base = smoothstep(0.5, 0.3, d) * 0.12;
            float fire = smoothstep(0.5, 0.15, d) * vFire * 0.5;
            vec3 col = mix(vColor, vec3(1.0, 0.85, 0.9), vFire * 0.6);
            gl_FragColor = vec4(col, base + fire);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );

  // Add fireTime attribute
  const fireTimeArr = useMemo(() => new Float32Array(NODE_COUNT).fill(-10), []);
  const fireTimeArrGlow = useMemo(() => new Float32Array(NODE_COUNT).fill(-10), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const pts = pointsRef.current;
    const glow = glowRef.current;
    const lines = linesRef.current;
    const group = groupRef.current;
    if (!pts || !lines || !glow || !group) return;

    // Parallax rotation
    group.rotation.y = THREE.MathUtils.lerp(group.rotation.y, mouseRef.current.x * 0.15, 0.03);
    group.rotation.x = THREE.MathUtils.lerp(group.rotation.x, mouseRef.current.y * 0.08, 0.03);

    // Slow auto-rotation
    group.rotation.z = Math.sin(t * 0.05) * 0.03;

    const posArr = pts.geometry.attributes.position.array as Float32Array;
    const sizeArr = pts.geometry.attributes.size.array as Float32Array;
    const glowPosArr = glow.geometry.attributes.position.array as Float32Array;
    const ftArr = pts.geometry.attributes.fireTime.array as Float32Array;
    const ftGlowArr = glow.geometry.attributes.fireTime.array as Float32Array;

    pointMaterial.uniforms.uTime.value = t;
    glowMaterial.uniforms.uTime.value = t;

    for (let i = 0; i < NODE_COUNT; i++) {
      const i3 = i * 3;
      posArr[i3] += velocities[i3];
      posArr[i3 + 1] += velocities[i3 + 1];
      posArr[i3 + 2] += velocities[i3 + 2];

      if (Math.abs(posArr[i3]) > SPREAD_X / 2) velocities[i3] *= -1;
      if (Math.abs(posArr[i3 + 1]) > SPREAD_Y / 2) velocities[i3 + 1] *= -1;
      if (Math.abs(posArr[i3 + 2]) > SPREAD_Z / 2) velocities[i3 + 2] *= -1;

      // Gentle pulse
      const pulse = Math.sin(t * 1.8 + pulsePhases[i]) * 0.5 + 0.5;
      sizeArr[i] = 2.5 + pulse * 2.5;

      glowPosArr[i3] = posArr[i3];
      glowPosArr[i3 + 1] = posArr[i3 + 1];
      glowPosArr[i3 + 2] = posArr[i3 + 2];
    }

    pts.geometry.attributes.position.needsUpdate = true;
    pts.geometry.attributes.size.needsUpdate = true;
    glow.geometry.attributes.position.needsUpdate = true;

    // Build connections — fewer but with fire effect
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

          // Fire when newly connected (distance just crossed threshold)
          const wasClose = fireTimes[i] > t - 0.1 || fireTimes[j] > t - 0.1;
          if (dist < MAX_DISTANCE * 0.5 && !wasClose && Math.random() < 0.02) {
            fireTimes[i] = t;
            fireTimes[j] = t;
            ftArr[i] = t;
            ftArr[j] = t;
            ftGlowArr[i] = t;
            ftGlowArr[j] = t;
          }

          // Check if either node is "firing"
          const fireI = t - fireTimes[i] < 1.0 ? (1.0 - (t - fireTimes[i])) : 0;
          const fireJ = t - fireTimes[j] < 1.0 ? (1.0 - (t - fireTimes[j])) : 0;
          const lineFire = Math.max(fireI, fireJ);

          linePositions[li] = posArr[i * 3];
          linePositions[li + 1] = posArr[i * 3 + 1];
          linePositions[li + 2] = posArr[i * 3 + 2];
          linePositions[li + 3] = posArr[j * 3];
          linePositions[li + 4] = posArr[j * 3 + 1];
          linePositions[li + 5] = posArr[j * 3 + 2];

          // Brighten line when firing
          const brightness = alpha * (0.4 + lineFire * 0.6);
          lineColors[li] = (0.91 + lineFire * 0.09) * brightness;
          lineColors[li + 1] = (0.34 + lineFire * 0.56) * brightness;
          lineColors[li + 2] = (0.48 + lineFire * 0.42) * brightness;
          lineColors[li + 3] = (0.91 + lineFire * 0.09) * brightness;
          lineColors[li + 4] = (0.34 + lineFire * 0.56) * brightness;
          lineColors[li + 5] = (0.48 + lineFire * 0.42) * brightness;
          lineIdx++;
        }
      }
    }

    pts.geometry.attributes.fireTime.needsUpdate = true;
    glow.geometry.attributes.fireTime.needsUpdate = true;

    for (let i = lineIdx * 6; i < linePositions.length; i++) {
      linePositions[i] = 0;
      lineColors[i] = 0;
    }

    lines.geometry.attributes.position.needsUpdate = true;
    lines.geometry.attributes.color.needsUpdate = true;
    lines.geometry.setDrawRange(0, lineIdx * 2);
  });

  return (
    <group ref={groupRef}>
      {/* Glow layer */}
      <points ref={glowRef} material={glowMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={NODE_COUNT} array={positions.slice()} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={NODE_COUNT} array={glowSizes} itemSize={1} />
          <bufferAttribute attach="attributes-color" count={NODE_COUNT} array={nodeColors.slice()} itemSize={3} />
          <bufferAttribute attach="attributes-fireTime" count={NODE_COUNT} array={fireTimeArrGlow} itemSize={1} />
        </bufferGeometry>
      </points>

      {/* Nodes */}
      <points ref={pointsRef} material={pointMaterial}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={NODE_COUNT} array={positions.slice()} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={NODE_COUNT} array={sizes} itemSize={1} />
          <bufferAttribute attach="attributes-color" count={NODE_COUNT} array={nodeColors} itemSize={3} />
          <bufferAttribute attach="attributes-fireTime" count={NODE_COUNT} array={fireTimeArr} itemSize={1} />
        </bufferGeometry>
      </points>

      {/* Connection lines */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={maxLines * 2} array={linePositions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={maxLines * 2} array={lineColors} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

function ZoomController() {
  const { camera, gl } = useThree();
  const targetZ = useRef(7);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZ.current = THREE.MathUtils.clamp(targetZ.current + e.deltaY * 0.005, 3, 14);
    };

    let lastTouchDist = 0;
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = (lastTouchDist - dist) * 0.02;
        targetZ.current = THREE.MathUtils.clamp(targetZ.current + delta, 3, 14);
        lastTouchDist = dist;
      }
    };

    const el = gl.domElement;
    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: true });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
    };
  }, [gl]);

  useFrame(() => {
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ.current, 0.08);
  });

  return null;
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
        <ZoomController />
        <NeuralNetwork />
      </Canvas>
    </div>
  );
}
