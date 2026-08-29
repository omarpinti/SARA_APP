import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  ShoppingCart, 
  Receipt, 
  Wallet,
  Lock,
  BarChart3,
  Droplets,
  LogOut
} from 'lucide-react';
import { SyncStatus } from '@/components/SyncStatus';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Pedidos', href: '/pedidos', icon: ClipboardList },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
  { name: 'Caja del Día', href: '/caja', icon: Wallet },
  { name: 'Cierre de Caja', href: '/cierre', icon: Lock },
  { name: 'Estadísticas', href: '/estadisticas', icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex-col hidden lg:flex">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Droplets className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display font-bold text-lg text-sidebar-foreground">Sara APP</h1>
          <p className="text-xs text-sidebar-foreground/60">Gestión de Bidones</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sync Status */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <SyncStatus />
      </div>

      {/* Cerrar sesión */}
      <div className="px-3 py-2 border-t border-sidebar-border">
        <button
          onClick={signOut}
          className="sidebar-item w-full text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/50 text-center">
          © 2024 Sara APP
        </p>
      </div>
    </aside>
  );
}
