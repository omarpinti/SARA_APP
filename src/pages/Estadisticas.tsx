import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { productos } from '@/data/mockData';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart3, TrendingUp, ShoppingCart, Users, Package, Wallet,
  Download, DollarSign, Receipt, Clock,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfYear, endOfYear, subDays, subMonths, subYears, format, eachDayOfInterval,
  parseISO, isWithinInterval,
} from 'date-fns';
import { es } from 'date-fns/locale';

type PeriodKey =
  | 'hoy' | 'ayer' | 'ultimos7' | 'ultimos30'
  | 'mes' | 'mesAnterior' | 'anio' | 'anioAnterior';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'ayer', label: 'Ayer' },
  { key: 'ultimos7', label: 'Últimos 7 días' },
  { key: 'ultimos30', label: 'Últimos 30 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mesAnterior', label: 'Mes anterior' },
  { key: 'anio', label: 'Este año' },
  { key: 'anioAnterior', label: 'Año anterior' },
];

function getRange(period: PeriodKey): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const now = new Date();
  switch (period) {
    case 'hoy': {
      const from = startOfDay(now), to = endOfDay(now);
      return { from, to, prevFrom: startOfDay(subDays(now, 1)), prevTo: endOfDay(subDays(now, 1)) };
    }
    case 'ayer': {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y), prevFrom: startOfDay(subDays(now, 2)), prevTo: endOfDay(subDays(now, 2)) };
    }
    case 'ultimos7':
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now), prevFrom: startOfDay(subDays(now, 13)), prevTo: endOfDay(subDays(now, 7)) };
    case 'ultimos30':
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now), prevFrom: startOfDay(subDays(now, 59)), prevTo: endOfDay(subDays(now, 30)) };
    case 'mes': {
      const from = startOfMonth(now), to = endOfMonth(now);
      const prev = subMonths(now, 1);
      return { from, to, prevFrom: startOfMonth(prev), prevTo: endOfMonth(prev) };
    }
    case 'mesAnterior': {
      const prev = subMonths(now, 1);
      const prev2 = subMonths(now, 2);
      return { from: startOfMonth(prev), to: endOfMonth(prev), prevFrom: startOfMonth(prev2), prevTo: endOfMonth(prev2) };
    }
    case 'anio': {
      const from = startOfYear(now), to = endOfYear(now);
      const prev = subYears(now, 1);
      return { from, to, prevFrom: startOfYear(prev), prevTo: endOfYear(prev) };
    }
    case 'anioAnterior': {
      const prev = subYears(now, 1);
      const prev2 = subYears(now, 2);
      return { from: startOfYear(prev), to: endOfYear(prev), prevFrom: startOfYear(prev2), prevTo: endOfYear(prev2) };
    }
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', '#8b5cf6', '#06b6d4'];

export default function Estadisticas() {
  const { ventas, gastos, clientes, pedidos } = useStore();
  const [period, setPeriod] = useState<PeriodKey>('mes');

  const range = useMemo(() => getRange(period), [period]);

  const inRange = (fechaStr: string, from: Date, to: Date) => {
    try {
      const d = parseISO(fechaStr.length === 10 ? `${fechaStr}T12:00:00` : fechaStr);
      return isWithinInterval(d, { start: from, end: to });
    } catch { return false; }
  };

  const ventasPeriodo = useMemo(
    () => ventas.filter(v => inRange(v.fecha, range.from, range.to)),
    [ventas, range]
  );
  const ventasPrev = useMemo(
    () => ventas.filter(v => inRange(v.fecha, range.prevFrom, range.prevTo)),
    [ventas, range]
  );
  const gastosPeriodo = useMemo(
    () => gastos.filter(g => inRange(g.fecha, range.from, range.to)),
    [gastos, range]
  );

  // KPIs
  const totalFacturado = ventasPeriodo.reduce((s, v) => s + v.precio, 0);
  const totalFacturadoPrev = ventasPrev.reduce((s, v) => s + v.precio, 0);
  const cantidadVentas = ventasPeriodo.length;
  const ticketPromedio = cantidadVentas > 0 ? totalFacturado / cantidadVentas : 0;
  const totalGastos = gastosPeriodo.reduce((s, g) => s + g.monto, 0);
  const ganancia = totalFacturado - totalGastos;
  const margen = totalFacturado > 0 ? (ganancia / totalFacturado) * 100 : 0;
  const crecimiento = totalFacturadoPrev > 0
    ? ((totalFacturado - totalFacturadoPrev) / totalFacturadoPrev) * 100
    : (totalFacturado > 0 ? 100 : 0);

  // Pedidos
  const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
  const pedidosSubidos = pedidos.filter(p => p.estado === 'subido').length;
  const pedidosEntregados = pedidos.filter(p => p.estado === 'entregado').length;

  // Clientes
  const clientesActivosIds = new Set(ventasPeriodo.map(v => v.clienteId));
  const clientesNuevos = clientes.filter(c => inRange(c.fechaAlta, range.from, range.to)).length;
  const ventasPorCliente: Record<string, { id: string; monto: number; count: number }> = {};
  ventasPeriodo.forEach(v => {
    if (!ventasPorCliente[v.clienteId]) ventasPorCliente[v.clienteId] = { id: v.clienteId, monto: 0, count: 0 };
    ventasPorCliente[v.clienteId].monto += v.precio;
    ventasPorCliente[v.clienteId].count += 1;
  });
  const topClientes = Object.values(ventasPorCliente)
    .sort((a, b) => b.monto - a.monto)
    .slice(0, 5)
    .map(x => {
      const c = clientes.find(cl => cl.id === x.id);
      return { nombre: c ? `${c.nombre} ${c.apellido}` : 'Cliente', monto: x.monto, count: x.count };
    });

  const clientesConDeuda = new Set(
    ventas.filter(v => v.estadoPago === 'pendiente').map(v => v.clienteId)
  ).size;

  // Productos
  const ventasPorProducto: Record<string, { id: string; cantidad: number; monto: number }> = {};
  ventasPeriodo.forEach(v => {
    const key = v.productoId;
    if (!ventasPorProducto[key]) ventasPorProducto[key] = { id: key, cantidad: 0, monto: 0 };
    ventasPorProducto[key].cantidad += (v.entregamos || 1);
    ventasPorProducto[key].monto += v.precio;
  });
  const topProductos = Object.values(ventasPorProducto)
    .sort((a, b) => b.monto - a.monto)
    .map(x => ({
      nombre: productos.find(p => p.id === x.id)?.nombre || 'Producto',
      cantidad: x.cantidad,
      monto: x.monto,
    }));

  const bidonesEntregados = ventasPeriodo.reduce((s, v) => s + (v.entregamos || 0), 0);
  const bidonesRetirados = ventasPeriodo.reduce((s, v) => s + (v.llevamos || 0), 0);

  // Formas de pago
  const pagosMap: Record<string, number> = {};
  ventasPeriodo.forEach(v => {
    const k = v.formaPago;
    pagosMap[k] = (pagosMap[k] || 0) + v.precio;
  });
  const pagosData = Object.entries(pagosMap).map(([name, value]) => ({ name, value }));

  const cobrado = ventasPeriodo.filter(v => v.estadoPago === 'pagado').reduce((s, v) => s + v.precio, 0);
  const pendienteCobro = ventasPeriodo.filter(v => v.estadoPago === 'pendiente').reduce((s, v) => s + v.precio, 0);

  // Serie temporal ventas por día
  const serieVentas = useMemo(() => {
    const days = eachDayOfInterval({ start: range.from, end: range.to });
    // Si el rango es muy grande, agrupamos por mes
    if (days.length > 62) {
      const byMonth: Record<string, number> = {};
      ventasPeriodo.forEach(v => {
        const d = parseISO(v.fecha.length === 10 ? `${v.fecha}T12:00:00` : v.fecha);
        const key = format(d, 'yyyy-MM');
        byMonth[key] = (byMonth[key] || 0) + v.precio;
      });
      return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => ({ fecha: format(parseISO(`${k}-01`), 'MMM yy', { locale: es }), monto: v }));
    }
    return days.map(d => {
      const key = format(d, 'yyyy-MM-dd');
      const monto = ventasPeriodo
        .filter(v => v.fecha.startsWith(key))
        .reduce((s, v) => s + v.precio, 0);
      return { fecha: format(d, 'dd MMM', { locale: es }), monto };
    });
  }, [ventasPeriodo, range]);

  const exportCSV = () => {
    const rows = [
      ['Fecha', 'Cliente', 'Producto', 'Precio', 'FormaPago', 'EstadoPago', 'Entregamos', 'Llevamos'],
      ...ventasPeriodo.map(v => {
        const c = clientes.find(cl => cl.id === v.clienteId);
        const p = productos.find(pr => pr.id === v.productoId);
        return [
          v.fecha,
          c ? `${c.nombre} ${c.apellido}` : '',
          p?.nombre || '',
          String(v.precio),
          v.formaPago,
          v.estadoPago,
          String(v.entregamos || 0),
          String(v.llevamos || 0),
        ];
      }),
    ];
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estadisticas_${period}_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Estadísticas
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(range.from, "d 'de' MMM", { locale: es })} — {format(range.to, "d 'de' MMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-full sm:w-[180px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCSV} className="h-10 shrink-0">
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Facturado"
          value={fmt(totalFacturado)}
          subtitle={`${crecimiento >= 0 ? '▲' : '▼'} ${Math.abs(crecimiento).toFixed(1)}% vs anterior`}
          icon={DollarSign}
          variant={crecimiento >= 0 ? 'success' : 'warning'}
        />
        <StatCard
          title="Ventas"
          value={cantidadVentas}
          subtitle={`Ticket prom. ${fmt(ticketPromedio)}`}
          icon={ShoppingCart}
          variant="primary"
        />
        <StatCard
          title="Ganancia"
          value={fmt(ganancia)}
          subtitle={`Margen ${margen.toFixed(1)}%`}
          icon={TrendingUp}
          variant={ganancia >= 0 ? 'success' : 'warning'}
        />
        <StatCard
          title="Gastos"
          value={fmt(totalGastos)}
          subtitle={`${gastosPeriodo.length} registros`}
          icon={Receipt}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Clientes activos"
          value={clientesActivosIds.size}
          subtitle={`${clientesNuevos} nuevos`}
          icon={Users}
          variant="primary"
        />
        <StatCard
          title="Con deuda"
          value={clientesConDeuda}
          subtitle={fmt(pendienteCobro) + ' pendiente'}
          icon={Wallet}
          variant="warning"
        />
        <StatCard
          title="Bidones"
          value={bidonesEntregados}
          subtitle={`${bidonesRetirados} retirados`}
          icon={Package}
          variant="default"
        />
        <StatCard
          title="Pedidos pend."
          value={pedidosPendientes}
          subtitle={`${pedidosSubidos} subidos · ${pedidosEntregados} entreg.`}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Serie temporal */}
      <div className="stat-card">
        <h2 className="font-display font-semibold text-base mb-4">Evolución de ventas</h2>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={serieVentas} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="fecha" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(v: number) => fmt(v)}
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="monto" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grids inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top productos */}
        <div className="stat-card">
          <h2 className="font-display font-semibold text-base mb-4">Productos más vendidos</h2>
          {topProductos.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin datos en el período</p>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductos} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Bar dataKey="monto" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Formas de pago */}
        <div className="stat-card">
          <h2 className="font-display font-semibold text-base mb-4">Formas de pago</h2>
          {pagosData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin datos en el período</p>
          ) : (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pagosData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                    {pagosData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Top clientes + Cobros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="stat-card">
          <h2 className="font-display font-semibold text-base mb-4">Top clientes</h2>
          {topClientes.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin datos en el período</p>
          ) : (
            <div className="space-y-2">
              {topClientes.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.count} compras</p>
                  </div>
                  <span className="font-semibold text-sm">{fmt(c.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="stat-card">
          <h2 className="font-display font-semibold text-base mb-4">Estado de cobros</h2>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between py-2 px-3 bg-success/5 rounded-lg">
              <span className="text-sm">Cobrado</span>
              <span className="font-semibold text-success">{fmt(cobrado)}</span>
            </div>
            <div className="flex items-center justify-between py-2 px-3 bg-warning/5 rounded-lg">
              <span className="text-sm">Pendiente</span>
              <span className="font-semibold text-warning">{fmt(pendienteCobro)}</span>
            </div>
          </div>
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasa de cobro</span>
              <span className="font-semibold">
                {totalFacturado > 0 ? ((cobrado / totalFacturado) * 100).toFixed(1) : '0.0'}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
