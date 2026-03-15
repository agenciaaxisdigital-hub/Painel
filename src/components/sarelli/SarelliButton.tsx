import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function SarelliButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-shadow md:bottom-8 md:right-8 rose-glow hover:shadow-[0_0_30px_rgba(251,113,133,0.3)]"
      style={{ bottom: "max(1.5rem, env(safe-area-inset-bottom, 0px) + 5rem)" }}
      title="Abrir Sarelli"
    >
      <motion.div
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
    </motion.button>
  );
}
