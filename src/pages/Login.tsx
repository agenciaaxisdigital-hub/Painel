import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import fernandaPhoto from "@/assets/fernanda-sarelli.jpeg";

function VantaBackground() {
  const vantaRef = useRef<HTMLDivElement>(null);
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadVanta() {
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
      // Load Vanta NET
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
        points: 20,
        maxDistance: 30,
        spacing: 12,
        showDots: true,
      });
    }

    loadVanta();

    return () => {
      cancelled = true;
      if (vantaEffect.current) vantaEffect.current.destroy();
    };
  }, []);

  return <div ref={vantaRef} className="absolute inset-0 z-0" />;
}

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const email = `${username.toLowerCase().replace(/\s+/g, ".")}@chamarosa.app`;
    const { error } = await signIn(email, password);
    if (error) {
      setError("Credenciais inválidas. Tente novamente.");
      setLoading(false);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* Vanta NET covers the ENTIRE screen */}
      <VantaBackground />
      <div className="absolute inset-0 z-[1] bg-background/30" />

      {/* Left side — photo + info over Vanta */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col items-center text-center px-12"
        >
          <div className="relative mb-8">
            <div className="absolute -inset-2 rounded-full border-2 border-white/30 animate-pulse" />
            <img
              src={fernandaPhoto}
              alt="Dra. Fernanda Sarelli"
              className="h-52 w-52 rounded-full object-cover border-4 border-white/50 shadow-2xl"
            />
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight">
            Dra. Fernanda Sarelli
          </h1>
          <p className="mt-2 text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
            Painel de Dados
          </p>
          <p className="mt-4 max-w-sm text-sm text-white/70 leading-relaxed">
            Pré-candidata a Deputada Estadual por Goiás, com compromisso real com a defesa da mulher e da criança.
          </p>
          <div className="mt-8 flex items-center gap-6 text-white/60 text-xs">
            <div className="text-center">
              <span className="block text-2xl font-bold text-white">GO</span>
              Estado
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-center">
              <span className="block text-2xl font-bold text-white">2026</span>
              Eleições
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right side — login form over Vanta */}
      <div className="relative flex flex-1 items-center justify-center p-6 z-10">

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile-only header with photo */}
          <div className="mb-8 text-center lg:hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <img
                src={fernandaPhoto}
                alt="Dra. Fernanda Sarelli"
                className="mx-auto h-24 w-24 rounded-full object-cover border-3 border-primary/50 rose-glow"
              />
            </motion.div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Dra. Fernanda Sarelli
            </h1>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-primary font-medium">
              Painel de Dados
            </p>
          </div>

          {/* Desktop header */}
          <div className="mb-8 hidden lg:block">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Painel de Inteligência
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Acesse o painel da campanha
            </p>
          </div>

          <div className="glass-card p-8 backdrop-blur-xl bg-background/60">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Usuário
                </label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="seu.usuario"
                  required
                  className="bg-white/[0.03] border-white/[0.08] focus:border-primary/50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="bg-white/[0.03] border-white/[0.08] focus:border-primary/50 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive">
                  {error}
                </motion.p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full text-primary-foreground rose-glow"
                style={{ background: "linear-gradient(135deg, hsl(341 90% 65%), hsl(350 80% 72%))" }}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Entrar
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground/50">
              Acesso restrito à equipe de campanha
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
