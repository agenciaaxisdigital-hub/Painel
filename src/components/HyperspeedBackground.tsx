import { useRef, useEffect } from "react";

// Color palette: pink, rose, fuchsia, purple
const PALETTE = [
  { r: 236, g: 72,  b: 153 }, // #ec4899 pink-500
  { r: 244, g: 63,  b: 94  }, // #f43f5e rose-500
  { r: 192, g: 38,  b: 211 }, // #c026d3 fuchsia-600
  { r: 232, g: 121, b: 249 }, // #e879f9 fuchsia-400
  { r: 168, g: 85,  b: 247 }, // #a855f7 purple-500
];

interface Blob {
  x: number; y: number;
  phase: number; phase2: number;
  amplitude: number; amplitude2: number;
  speed: number;
  baseX: number; baseY: number;
  radius: number;
  opacity: number;
  colorIdx: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  colorIdx: number;
  wobble: number; wobbleSpeed: number;
}

export default function HyperspeedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;

    // --- Aurora blobs (large soft glows) ---
    const blobs: Blob[] = Array.from({ length: 8 }, (_, i) => ({
      baseX:      0.1 + Math.random() * 0.8,
      baseY:      0.1 + Math.random() * 0.8,
      x: 0, y: 0,
      phase:      Math.random() * Math.PI * 2,
      phase2:     Math.random() * Math.PI * 2,
      amplitude:  0.08 + Math.random() * 0.14,
      amplitude2: 0.06 + Math.random() * 0.10,
      speed:      0.12 + Math.random() * 0.20,
      radius:     0.22 + Math.random() * 0.28,
      opacity:    0.055 + Math.random() * 0.065,
      colorIdx:   i % PALETTE.length,
    }));

    // --- Floating particles ---
    const TOTAL = 110;
    const particles: Particle[] = Array.from({ length: TOTAL }, () => spawnParticle(true));

    function spawnParticle(random = false): Particle {
      return {
        x:          Math.random(),
        y:          random ? Math.random() : 1.05,
        vx:         (Math.random() - 0.5) * 0.00045,
        vy:         -(0.00015 + Math.random() * 0.00040),
        life:       random ? Math.random() * 0.9 : 0,
        maxLife:    0.55 + Math.random() * 0.45,
        size:       1.2 + Math.random() * 2.2,
        colorIdx:   Math.floor(Math.random() * PALETTE.length),
        wobble:     Math.random() * Math.PI * 2,
        wobbleSpeed:(Math.random() - 0.5) * 0.025,
      };
    }

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (canvas.width !== W || canvas.height !== H) {
        canvas.width = W;
        canvas.height = H;
      }

      // Background
      ctx.fillStyle = "#070510";
      ctx.fillRect(0, 0, W, H);

      // ── Aurora blobs ──────────────────────────────────────────────
      for (const b of blobs) {
        b.x = b.baseX + Math.sin(t * b.speed + b.phase)  * b.amplitude;
        b.y = b.baseY + Math.cos(t * b.speed + b.phase2) * b.amplitude2;

        const bx = b.x * W;
        const by = b.y * H;
        const br = b.radius * Math.max(W, H);
        const c  = PALETTE[b.colorIdx];

        const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0,    `rgba(${c.r},${c.g},${c.b},${b.opacity})`);
        g.addColorStop(0.45, `rgba(${c.r},${c.g},${c.b},${(b.opacity * 0.35).toFixed(3)})`);
        g.addColorStop(1,    `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(bx, by, br, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Particles ─────────────────────────────────────────────────
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life += 0.0022 + Math.random() * 0.0008;

        if (p.life >= p.maxLife || p.y < -0.05) {
          particles[i] = spawnParticle(false);
          continue;
        }

        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.00009;
        p.y += p.vy;

        const px = p.x * W;
        const py = p.y * H;
        const lifeRatio = p.life / p.maxLife;
        const alpha = Math.sin(lifeRatio * Math.PI) * 0.55;
        const c = PALETTE[p.colorIdx];
        const r = p.size * (1 + lifeRatio * 0.5);

        const pg = ctx.createRadialGradient(px, py, 0, px, py, r * 4);
        pg.addColorStop(0,   `rgba(${c.r},${c.g},${c.b},${alpha.toFixed(3)})`);
        pg.addColorStop(0.4, `rgba(${c.r},${c.g},${c.b},${(alpha * 0.3).toFixed(3)})`);
        pg.addColorStop(1,   `rgba(${c.r},${c.g},${c.b},0)`);
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(px, py, r * 4, 0, Math.PI * 2);
        ctx.fill();

        // Bright core
        ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${(alpha * 0.85).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Subtle flowing lines ───────────────────────────────────────
      const LINES = 6;
      for (let i = 0; i < LINES; i++) {
        const phase = (i / LINES) * Math.PI * 2 + t * 0.08;
        const y0 = ((i / LINES + t * 0.015) % 1) * H;
        const c = PALETTE[i % PALETTE.length];

        ctx.beginPath();
        ctx.moveTo(0, y0);
        for (let x = 0; x <= W; x += 8) {
          const yOff = Math.sin(x * 0.006 + phase) * 28 + Math.cos(x * 0.003 + phase * 0.7) * 14;
          ctx.lineTo(x, y0 + yOff);
        }
        ctx.strokeStyle = `rgba(${c.r},${c.g},${c.b},0.028)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // ── Edge vignette ─────────────────────────────────────────────
      const vig = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.78);
      vig.addColorStop(0,   "rgba(7,5,16,0)");
      vig.addColorStop(0.6, "rgba(7,5,16,0.08)");
      vig.addColorStop(1,   "rgba(7,5,16,0.62)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);

      t += 0.016;
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
}
