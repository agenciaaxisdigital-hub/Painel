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
        points: 10,
        maxDistance: 22,
        spacing: 16,
        showDots: true,
      });
    }

    loadVanta();

    return () => {
      cancelled = true;
      if (vantaEffect.current) vantaEffect.current.destroy();
    };
  }, []);

  return (
    <>
      <div ref={vantaRef} className="absolute inset-0 z-0" />
      {/* Pulse overlay — glowing orbs that drift and pulse */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.07] animate-pulse-slow"
          style={{
            background: "radial-gradient(circle, hsl(341 90% 65%) 0%, transparent 70%)",
            top: "10%", left: "20%",
            animation: "pulse-drift-1 8s ease-in-out infinite",
          }}
        />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(circle, hsl(341 90% 75%) 0%, transparent 70%)",
            bottom: "15%", right: "10%",
            animation: "pulse-drift-2 10s ease-in-out infinite",
          }}
        />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(circle, hsl(350 80% 80%) 0%, transparent 70%)",
            top: "50%", left: "60%",
            animation: "pulse-drift-3 12s ease-in-out infinite",
          }}
        />
      </div>
      <style>{`
        @keyframes pulse-drift-1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.07; }
          50% { transform: translate(40px, -30px) scale(1.2); opacity: 0.12; }
        }
        @keyframes pulse-drift-2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.05; }
          50% { transform: translate(-30px, 20px) scale(1.3); opacity: 0.1; }
        }
        @keyframes pulse-drift-3 {
          0%, 100% { transform: translate(0, 0) scale(0.8); opacity: 0.04; }
          50% { transform: translate(20px, 40px) scale(1.1); opacity: 0.08; }
        }
      `}</style>
    </>
  );
}
