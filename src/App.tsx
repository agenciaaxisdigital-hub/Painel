import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MapaGoias from "./pages/MapaGoias";
import ZonasEleitorais from "./pages/ZonasEleitorais";
import Eleitores from "./pages/Eleitores";
import Formularios from "./pages/Formularios";
import Engajamento from "./pages/Engajamento";
import VisitantesFrequentes from "./pages/VisitantesFrequentes";
import TempoReal from "./pages/TempoReal";
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
              <Route path="/" element={<Dashboard />} />
              <Route path="/mapa-goias" element={<MapaGoias />} />
              <Route path="/zonas-eleitorais" element={<ZonasEleitorais />} />
              <Route path="/eleitores" element={<Eleitores />} />
              <Route path="/formularios" element={<Formularios />} />
              <Route path="/engajamento" element={<Engajamento />} />
              <Route path="/visitantes-frequentes" element={<VisitantesFrequentes />} />
              <Route path="/tempo-real" element={<TempoReal />} />
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
