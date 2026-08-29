import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  ShoppingCart, 
  Receipt, 
  Wallet,
  Lock,
  BarChart3
} from 'lucide-react';

const navigation = [
  { name: 'Inicio', href: '/', icon: LayoutDashboard },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Pedidos', href: '/pedidos', icon: ClipboardList },
  { name: 'Ventas', href: '/ventas', icon: ShoppingCart },
  { name: 'Gastos', href: '/gastos', icon: Receipt },
  { name: 'Caja', href: '/caja', icon: Wallet },
  { name: 'Cierre', href: '/cierre', icon: Lock },
  { name: 'Stats', href: '/estadisticas', icon: BarChart3 },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-pb lg:hidden">
      <div className="flex justify-around items-center h-16 overflow-x-auto no-scrollbar">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center min-w-[56px] px-2 py-2 transition-colors ${
                isActive 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-[10px] mt-1 font-medium truncate">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
