import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import NeuralNetworkBackground from "@/components/NeuralNetworkBackground";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { SarelliButton } from "@/components/sarelli/SarelliButton";
import { SarelliChat } from "@/components/sarelli/SarelliChat";

export function DashboardLayout() {
  const { session, loading } = useAuth();
  const [sarelliOpen, setSarelliOpen] = useState(false);
  const currentLocation = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      {/* Subtle ambient background — same neural net but very faded */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.08]">
        <NeuralNetworkBackground />
      </div>
      <div className="ambient-glow" />
      <AppSidebar />
      <main className="relative z-10 flex-1 min-w-0 pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="p-4 md:p-6 lg:p-8"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {!sarelliOpen && <SarelliButton onClick={() => setSarelliOpen(true)} />}
      <SarelliChat open={sarelliOpen} onClose={() => setSarelliOpen(false)} />
    </div>
  );
}
