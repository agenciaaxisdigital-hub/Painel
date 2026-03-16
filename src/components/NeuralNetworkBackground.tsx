import { useRef, useEffect } from "react";

export default function NeuralNetworkBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let renderer: any;
    let scene: any;
    let camera: any;
    let animationId: number;
    let mouseX = 0;
    let mouseY = 0;
    let rotX = 0;
    let rotY = 0;

    async function init() {
      // Load THREE.js
      if (!(window as any).THREE) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      if (cancelled || !containerRef.current) return;

      const THREE = (window as any).THREE;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;

      // Setup
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
      camera.position.z = 8;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x0a0a0f);
      containerRef.current.appendChild(renderer.domElement);

      // Create nodes
      const NODE_COUNT = 80;
      const SPREAD = 10;
      const MAX_DIST = 3.0;

      const nodePositions: number[][] = [];
      const nodeVelocities: number[][] = [];

      const dotGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0xe8567a });

      const nodeGroup = new THREE.Group();
      const dots: any[] = [];

      for (let i = 0; i < NODE_COUNT; i++) {
        const x = (Math.random() - 0.5) * SPREAD;
        const y = (Math.random() - 0.5) * SPREAD;
        const z = (Math.random() - 0.5) * SPREAD;
        nodePositions.push([x, y, z]);
        nodeVelocities.push([
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.006,
        ]);

        const dot = new THREE.Mesh(dotGeo, dotMat.clone());
        dot.position.set(x, y, z);
        dots.push(dot);
        nodeGroup.add(dot);
      }

      // Glow sprites for nodes
      const glowCanvas = document.createElement("canvas");
      glowCanvas.width = 64;
      glowCanvas.height = 64;
      const ctx = glowCanvas.getContext("2d")!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(232, 86, 122, 0.8)");
      grad.addColorStop(0.3, "rgba(232, 86, 122, 0.3)");
      grad.addColorStop(1, "rgba(232, 86, 122, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      const glowTexture = new THREE.CanvasTexture(glowCanvas);

      const glowGroup = new THREE.Group();
      const glows: any[] = [];
      for (let i = 0; i < NODE_COUNT; i++) {
        const spriteMat = new THREE.SpriteMaterial({
          map: glowTexture,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.6,
        });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(0.5, 0.5, 1);
        sprite.position.copy(dots[i].position);
        glows.push(sprite);
        glowGroup.add(sprite);
      }

      // Lines
      const lineMaxSegments = NODE_COUNT * 6;
      const lineGeo = new THREE.BufferGeometry();
      const linePos = new Float32Array(lineMaxSegments * 6);
      const lineCol = new Float32Array(lineMaxSegments * 6);
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
      lineGeo.setAttribute("color", new THREE.BufferAttribute(lineCol, 3));
      const lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
      });
      const linesMesh = new THREE.LineSegments(lineGeo, lineMat);

      const masterGroup = new THREE.Group();
      masterGroup.add(nodeGroup);
      masterGroup.add(glowGroup);
      masterGroup.add(linesMesh);
      scene.add(masterGroup);

      // Pulse tracking
      const pulseTime = new Float32Array(NODE_COUNT).fill(-100);

      // Mouse interaction
      const onMouseMove = (e: MouseEvent) => {
        mouseX = (e.clientX / w - 0.5) * 2;
        mouseY = (e.clientY / h - 0.5) * 2;
      };

      // Touch interaction
      let touchStartX = 0;
      let touchStartY = 0;
      const onTouchStart = (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      };
      const onTouchMove = (e: TouchEvent) => {
        mouseX += (e.touches[0].clientX - touchStartX) * 0.003;
        mouseY += (e.touches[0].clientY - touchStartY) * 0.003;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      };

      // Zoom
      let targetZoom = 8;
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        targetZoom = Math.max(4, Math.min(16, targetZoom + e.deltaY * 0.005));
      };

      containerRef.current!.addEventListener("mousemove", onMouseMove);
      containerRef.current!.addEventListener("touchstart", onTouchStart, { passive: true });
      containerRef.current!.addEventListener("touchmove", onTouchMove, { passive: true });
      containerRef.current!.addEventListener("wheel", onWheel, { passive: false });

      // Resize
      const onResize = () => {
        if (!containerRef.current) return;
        const nw = containerRef.current.clientWidth;
        const nh = containerRef.current.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      };
      window.addEventListener("resize", onResize);

      // Animation loop
      const clock = new THREE.Clock();

      function animate() {
        if (cancelled) return;
        animationId = requestAnimationFrame(animate);

        const t = clock.getElapsedTime();

        // Smooth 360° rotation from mouse
        rotY += (mouseX * 0.8 - rotY) * 0.03;
        rotX += (mouseY * 0.4 - rotX) * 0.03;

        masterGroup.rotation.y = rotY + t * 0.03; // Auto-rotate + mouse
        masterGroup.rotation.x = rotX;
        masterGroup.rotation.z = Math.sin(t * 0.08) * 0.05;

        // Smooth zoom
        camera.position.z += (targetZoom - camera.position.z) * 0.05;

        // Update nodes
        for (let i = 0; i < NODE_COUNT; i++) {
          const p = nodePositions[i];
          const v = nodeVelocities[i];
          p[0] += v[0];
          p[1] += v[1];
          p[2] += v[2];

          for (let axis = 0; axis < 3; axis++) {
            if (Math.abs(p[axis]) > SPREAD / 2) v[axis] *= -1;
          }

          dots[i].position.set(p[0], p[1], p[2]);
          glows[i].position.set(p[0], p[1], p[2]);

          // Pulse animation for glow
          const timeSincePulse = t - pulseTime[i];
          const pulseIntensity = timeSincePulse < 1.5 ? Math.pow(1 - timeSincePulse / 1.5, 2) : 0;
          const baseScale = 0.4 + Math.sin(t * 2 + i) * 0.1;
          const scale = baseScale + pulseIntensity * 1.2;
          glows[i].scale.set(scale, scale, 1);
          (glows[i].material as any).opacity = 0.4 + pulseIntensity * 0.6;

          // Dot color pulse
          const dotColor = (dots[i].material as any).color;
          const fireR = 1.0;
          const fireG = 0.9 + pulseIntensity * 0.1;
          const fireB = 0.95;
          dotColor.setRGB(
            0.91 + pulseIntensity * (fireR - 0.91),
            0.34 + pulseIntensity * (fireG - 0.34),
            0.48 + pulseIntensity * (fireB - 0.48)
          );
          const dotScale = 1 + pulseIntensity * 2;
          dots[i].scale.set(dotScale, dotScale, dotScale);
        }

        // Build lines
        let lineIdx = 0;
        for (let i = 0; i < NODE_COUNT && lineIdx < lineMaxSegments; i++) {
          for (let j = i + 1; j < NODE_COUNT && lineIdx < lineMaxSegments; j++) {
            const dx = nodePositions[i][0] - nodePositions[j][0];
            const dy = nodePositions[i][1] - nodePositions[j][1];
            const dz = nodePositions[i][2] - nodePositions[j][2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < MAX_DIST) {
              const alpha = Math.pow(1 - dist / MAX_DIST, 1.5);

              // Trigger pulse when very close
              if (dist < MAX_DIST * 0.35 && Math.random() < 0.008) {
                pulseTime[i] = t;
                pulseTime[j] = t;
              }

              const li = lineIdx * 6;
              linePos[li] = nodePositions[i][0];
              linePos[li + 1] = nodePositions[i][1];
              linePos[li + 2] = nodePositions[i][2];
              linePos[li + 3] = nodePositions[j][0];
              linePos[li + 4] = nodePositions[j][1];
              linePos[li + 5] = nodePositions[j][2];

              // Check if connected nodes are pulsing
              const fireI = t - pulseTime[i] < 1.0 ? 1 - (t - pulseTime[i]) : 0;
              const fireJ = t - pulseTime[j] < 1.0 ? 1 - (t - pulseTime[j]) : 0;
              const fire = Math.max(fireI, fireJ);

              const r = (0.91 + fire * 0.09) * alpha;
              const g = (0.34 + fire * 0.56) * alpha;
              const b = (0.48 + fire * 0.42) * alpha;

              lineCol[li] = r; lineCol[li + 1] = g; lineCol[li + 2] = b;
              lineCol[li + 3] = r; lineCol[li + 4] = g; lineCol[li + 5] = b;
              lineIdx++;
            }
          }
        }

        // Clear unused
        for (let i = lineIdx * 6; i < linePos.length; i++) {
          linePos[i] = 0;
          lineCol[i] = 0;
        }

        lineGeo.attributes.position.needsUpdate = true;
        lineGeo.attributes.color.needsUpdate = true;
        lineGeo.setDrawRange(0, lineIdx * 2);

        renderer.render(scene, camera);
      }

      animate();

      // Cleanup function stored for effect cleanup
      return () => {
        window.removeEventListener("resize", onResize);
        containerRef.current?.removeEventListener("mousemove", onMouseMove);
        cancelAnimationFrame(animationId);
        renderer.dispose();
        if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(renderer.domElement);
        }
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => { cleanup = fn; });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0" />;
}
