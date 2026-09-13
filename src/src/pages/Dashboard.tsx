import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { 
  Users, 
  Clock,
  ShoppingCart, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  ClipboardList
} from 'lucide-react';
import { productos } from '@/data/mockData';

export default function Dashboard() {
  const { clientes, pedidos, ventas, gastos, movimientos } = useStore();

  const hoy = new Date().toISOString().split('T')[0];

  // Estadísticas
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
  const ventasHoy = ventas.filter(v => v.fecha === hoy);
  const gastosHoy = gastos.filter(g => g.fecha === hoy);

  const ingresosEfectivoHoy = movimientos
    .filter(m => m.fechaHora.startsWith(hoy) && m.tipo === 'ingreso')
    .reduce((sum, m) => sum + m.monto, 0);

  const egresosEfectivoHoy = movimientos
    .filter(m => m.fechaHora.startsWith(hoy) && m.tipo === 'egreso')
    .reduce((sum, m) => sum + m.monto, 0);

  const saldoHoy = ingresosEfectivoHoy - egresosEfectivoHoy;

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const getProductoNombre = (id: string) => 
    productos.find(p => p.id === id)?.nombre || 'Producto';

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Stats Grid - Single column on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Clientes"
          value={clientes.length}
          subtitle="Total registrados"
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Pendientes"
          value={pedidosPendientes}
          subtitle="Por entregar"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Ventas Hoy"
          value={ventasHoy.length}
          subtitle={formatCurrency(ventasHoy.reduce((s, v) => s + v.precio, 0))}
          icon={ShoppingCart}
          variant="success"
        />
        <StatCard
          title="Efectivo"
          value={formatCurrency(saldoHoy)}
          subtitle="Caja del día"
          icon={Wallet}
          variant="default"
        />
      </div>

      {/* Two column on large screens, stacked on mobile */}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {/* Pedidos Pendientes */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-base">Pedidos Pendientes</h2>
          </div>
          {pedidos.filter(p => p.estado === 'pendiente').length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No hay pedidos pendientes</p>
          ) : (
            <div className="space-y-3">
              {pedidos
                .filter(p => p.estado === 'pendiente')
                .slice(0, 5)
                .map(pedido => {
                  const cliente = clientes.find(c => c.id === pedido.clienteId);
                  return (
                    <div key={pedido.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{cliente?.nombre} {cliente?.apellido}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {pedido.detalles.map(d => `${d.cantidad}x ${getProductoNombre(d.productoId)}`).join(', ')}
                        </p>
                      </div>
                      <span className="status-badge status-pending shrink-0 ml-2">Pendiente</span>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Movimientos de Hoy */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-base">Movimientos de Caja</h2>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between py-2 px-3 bg-success/5 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <span className="text-sm">Ingresos</span>
              </div>
              <span className="font-semibold text-success">{formatCurrency(ingresosEfectivoHoy)}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-destructive/5 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <span className="text-sm">Egresos</span>
              </div>
              <span className="font-semibold text-destructive">{formatCurrency(egresosEfectivoHoy)}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="font-medium">Saldo Actual</span>
              <span className="text-lg font-display font-bold">{formatCurrency(saldoHoy)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
