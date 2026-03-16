import { useRef, useEffect } from "react";

export default function NeuralNetworkBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVanta() {
      if (!(window as any).THREE) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      if (!(window as any).VANTA) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/vanta/0.5.24/vanta.net.min.js";
          s.onload = () => resolve();
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }

      if (cancelled || !vantaRef.current || !(window as any).VANTA) return;

      vantaEffect.current = (window as any).VANTA.NET({
        el: vantaRef.current,
        THREE: (window as any).THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1.0,
        scaleMobile: 1.0,
        color: 0xe8567a,
        backgroundColor: 0x0a0a0f,
        points: 14,
        maxDistance: 25,
        spacing: 15,
        showDots: true,
      });
    }

    loadVanta();

    // Force resize on window changes so canvas always fills container
    const handleResize = () => {
      if (vantaEffect.current?.resize) {
        vantaEffect.current.resize();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", handleResize);
      if (vantaEffect.current) vantaEffect.current.destroy();
    };
  }, []);

  return (
    <>
      <div
        ref={vantaRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          minHeight: "100vh",
          minWidth: "100vw",
        }}
      />
      {/* Subtle pulsing glow orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full"
          style={{
            width: 200, height: 200, top: "15%", left: "25%",
            background: "radial-gradient(circle, rgba(232,86,122,0.12) 0%, transparent 70%)",
            animation: "glow-pulse-1 6s ease-in-out infinite",
          }}
        />
        <div className="absolute rounded-full"
          style={{
            width: 160, height: 160, bottom: "20%", right: "15%",
            background: "radial-gradient(circle, rgba(232,86,122,0.08) 0%, transparent 70%)",
            animation: "glow-pulse-2 8s ease-in-out infinite",
          }}
        />
        <div className="absolute rounded-full"
          style={{
            width: 120, height: 120, top: "55%", left: "65%",
            background: "radial-gradient(circle, rgba(232,86,122,0.06) 0%, transparent 70%)",
            animation: "glow-pulse-3 10s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes glow-pulse-1 {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 1; }
        }
        @keyframes glow-pulse-2 {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.2); opacity: 0.9; }
        }
        @keyframes glow-pulse-3 {
          0%, 100% { transform: scale(0.9); opacity: 0.3; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
      `}</style>
    </>
  );
}
