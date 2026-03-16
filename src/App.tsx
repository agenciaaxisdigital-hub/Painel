import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import VisaoGeral from "./pages/VisaoGeral";
import Visitantes from "./pages/Visitantes";
import Formularios from "./pages/Formularios";
import TodasInteracoes from "./pages/TodasInteracoes";
import Interacoes from "./pages/TodasInteracoes";
import MapaGoias from "./pages/MapaGoias";
import Exportar from "./pages/Exportar";
import Configuracoes from "./pages/Configuracoes";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<VisaoGeral />} />
              <Route path="/visitantes" element={<Visitantes />} />
              <Route path="/formularios" element={<Formularios />} />
              <Route path="/interacoes" element={<TodasInteracoes />} />
              <Route path="/cliques" element={<Cliques />} />
              <Route path="/zonas" element={<ZonasGoiania />} />
              <Route path="/mapa-goias" element={<MapaGoias />} />
              <Route path="/exportar" element={<Exportar />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
