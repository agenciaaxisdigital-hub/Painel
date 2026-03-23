import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import fernandaPhoto from "@/assets/fernanda-sarelli.jpeg";
import Hyperspeed from "@/components/Hyperspeed";

const hyperspeedPreset = {
  onSpeedUp: () => {},
  onSlowDown: () => {},
  distortion: "turbulentDistortion",
  length: 800,
  roadWidth: 18,
  islandWidth: 4,
  lanesPerRoad: 3,
  fov: 100,
  fovSpeedUp: 140,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 40,
  lightPairsPerRoadWay: 80,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  movingAwaySpeed: [60, 100],
  movingCloserSpeed: [-120, -180],
  carLightsLength: [800 * 0.04, 800 * 0.14],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.8, 0.8],
  carFloorSeparation: [0, 5],
  colors: {
    roadColor: 0x080510,
    islandColor: 0x0a0812,
    background: 0x070510,
    shoulderLines: 0x1a0a1a,
    brokenLines: 0x1a0a1a,
    leftCars: [0xec4899, 0xf9a8d4, 0xbe185d, 0xfda4af],
    rightCars: [0xf43f5e, 0xff6b9d, 0xc026d3, 0xe879f9],
    sticks: 0xf472b6,
  },
};

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState(() => localStorage.getItem("saved_user") || "");
  const [password, setPassword] = useState(() => localStorage.getItem("saved_pass") || "");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(() => !!localStorage.getItem("saved_user"));

  const preset = useMemo(() => hyperspeedPreset, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (remember) {
      localStorage.setItem("saved_user", username);
      localStorage.setItem("saved_pass", password);
    } else {
      localStorage.removeItem("saved_user");
      localStorage.removeItem("saved_pass");
    }

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
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#070510" }}
    >
      <Hyperspeed effectOptions={preset} />

      {/* Vinheta radial */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(7,5,16,0.5) 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm space-y-6 relative z-10"
      >
        {/* Foto + nome */}
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-28 h-28">
            <div
              className="absolute inset-0 rounded-full p-[3px]"
              style={{ background: "linear-gradient(135deg, #ec4899, #fb7185)" }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-black">
                <img
                  src={fernandaPhoto}
                  alt="Dra. Fernanda Sarelli"
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Dra. Fernanda Sarelli
            </h1>
            <p
              className="font-semibold text-pink-400 uppercase tracking-widest mt-1"
              style={{ fontSize: "11px" }}
            >
              Painel de Dados
            </p>
          </div>
          <p className="text-white/40" style={{ fontSize: "11px" }}>
            Acesso exclusivo da equipe
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-6 rounded-2xl"
          style={{
            background: "rgba(0,0,0,0.60)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px hsl(340 82% 55% / 0.15)",
          }}
        >
          {/* Usuário */}
          <div className="space-y-1.5">
            <label
              className="block font-medium uppercase tracking-widest text-white/50"
              style={{ fontSize: "11px" }}
            >
              Usuário
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: Administrador"
                required
                autoCapitalize="none"
                autoCorrect="off"
                autoComplete="username"
                className="w-full h-11 pl-10 pr-4 rounded-lg text-white placeholder:text-white/25 outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontSize: "16px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(236,72,153,0.50)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
              />
            </div>
          </div>

          {/* Senha */}
          <div className="space-y-1.5">
            <label
              className="block font-medium uppercase tracking-widest text-white/50"
              style={{ fontSize: "11px" }}
            >
              Senha
            </label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full h-11 pl-10 pr-10 rounded-lg text-white placeholder:text-white/25 outline-none transition-colors"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  fontSize: "16px",
                }}
                onFocus={(e) => (e.target.style.borderColor = "rgba(236,72,153,0.50)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.10)")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Lembrar */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 rounded cursor-pointer"
              style={{ accentColor: "#ec4899" }}
            />
            <label htmlFor="remember" className="text-xs text-white/50 cursor-pointer select-none">
              Lembrar meus dados
            </label>
          </div>

          {/* Erro */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400"
            >
              {error}
            </motion.p>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 touch-manipulation"
            style={{
              background: "linear-gradient(to right, #ec4899, #fb7185)",
              boxShadow: "0 4px 16px hsl(340 82% 55% / 0.30)",
            }}
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="text-center space-y-1">
          <p className="text-white/25" style={{ fontSize: "10px" }}>
            Pré-candidata a Deputada Estadual — GO 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}
