import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Droplets, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useInitialData } from "@/hooks/useInitialData";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Pedidos from "./pages/Pedidos";
import Ventas from "./pages/Ventas";
import Gastos from "./pages/Gastos";
import Caja from "./pages/Caja";
import CierreCaja from "./pages/CierreCaja";
import Estadisticas from "./pages/Estadisticas";
import NotFound from "./pages/NotFound";
import RecuperarPassword from '@/pages/RecuperarPassword';
import ActualizarPassword from '@/pages/ActualizarPassword';
import AdministracionProductos from '@/pages/AdministracionProductos';
import AdministracionPromociones from "./pages/AdministracionPromociones";

const queryClient = new QueryClient();

function AuthedApp() {
  const { ready, error } = useInitialData();

  if (!ready) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
          <Droplets className="w-7 h-7 text-primary-foreground" />
        </div>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/ventas" element={<Ventas />} />
        <Route path="/gastos" element={<Gastos />} />
        <Route path="/caja" element={<Caja />} />
        <Route path="/cierre" element={<CierreCaja />} />
        <Route path="/estadisticas" element={<Estadisticas />} />
        <Route path="/administracion/productos" element={<AdministracionProductos />} />
       <Route path="/administracion/promociones" element={<AdministracionPromociones />}
/>

      <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<Login />} />
            <Route
              path="/recuperar-password"
              element={<RecuperarPassword />}
            />
            <Route
              path="/actualizar-password"
              element={<ActualizarPassword />}
            />
            <Route path="/registro" element={<Register />} />

            {/* Rutas protegidas */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AuthedApp />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;