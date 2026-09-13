import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  TrendingUp, ShoppingCart, Users, Package, Wallet,
  Download, DollarSign, Receipt, Clock, CalendarIcon,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import {
  startOfDay, endOfDay, startOfMonth, endOfMonth,
  startOfYear, endOfYear, subDays, subMonths, subYears, format, eachDayOfInterval,
  parseISO, differenceInCalendarDays,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  fetchVentasRango,
  fetchClientesConDeuda,
  fetchDetalleVentasPorIds,
  fetchGastosRango,
  type VentaEstadistica,
  type DetalleEstadistica,
} from '@/lib/api/estadisticas';

type PeriodKey =
  | 'hoy' | 'ayer' | 'ultimos7' | 'ultimos30'
  | 'mes' | 'mesAnterior' | 'anio' | 'anioAnterior' | 'personalizado';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: 'ayer', label: 'Ayer' },
  { key: 'ultimos7', label: 'Últimos 7 días' },
  { key: 'ultimos30', label: 'Últimos 30 días' },
  { key: 'mes', label: 'Este mes' },
  { key: 'mesAnterior', label: 'Mes anterior' },
  { key: 'anio', label: 'Este año' },
  { key: 'anioAnterior', label: 'Año anterior' },
  { key: 'personalizado', label: 'Otro período' },
];

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function getRange(
  period: PeriodKey,
  custom: { from?: Date; to?: Date }
): { from: Date; to: Date; prevFrom: Date; prevTo: Date } {
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
    case 'personalizado': {
      const from = startOfDay(custom.from || now);
      const to = endOfDay(custom.to || custom.from || now);
      const dias = differenceInCalendarDays(to, from) + 1;
      const prevTo = endOfDay(subDays(from, 1));
      const prevFrom = startOfDay(subDays(prevTo, dias - 1));
      return { from, to, prevFrom, prevTo };
    }
  }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n);

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', '#8b5cf6', '#06b6d4'];

export default function Estadisticas() {
  const { negocioId } = useAuth();
  const { clientes, pedidos } = useStore();

  const [period, setPeriod] = useState<PeriodKey>('mes');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  const range = useMemo(
    () => getRange(period, { from: customFrom, to: customTo }),
    [period, customFrom, customTo]
  );

  const [ventasPeriodo, setVentasPeriodo] = useState<VentaEstadistica[]>([]);
  const [ventasPrev, setVentasPrev] = useState<VentaEstadistica[]>([]);
  const [gastosPeriodo, setGastosPeriodo] = useState<any[]>([]);
  const [detalleVentas, setDetalleVentas] = useState<DetalleEstadistica[]>([]);
  const [clientesConDeuda, setClientesConDeuda] = useState(0);
  const [cargando, setCargando] = useState(false);

  const esperandoFechaPersonalizada = period === 'personalizado' && !customFrom;

  const handleSelectPeriod = (value: PeriodKey) => {
    setPeriod(value);
    if (value === 'personalizado') {
      setCalendarOpen(true);
    }
  };

  useEffect(() => {
    if (!negocioId || esperandoFechaPersonalizada) return;

    let cancelado = false;
    setCargando(true);

    const fromStr = toISODate(range.from);
    const toStr = toISODate(range.to);
    const prevFromStr = toISODate(range.prevFrom);
    const prevToStr = toISODate(range.prevTo);

    (async () => {
      try {
        const [ventas, prevVentas, gastos, deuda] = await Promise.all([
          fetchVentasRango(negocioId, fromStr, toStr),
          fetchVentasRango(negocioId, prevFromStr, prevToStr),
          fetchGastosRango(negocioId, fromStr, toStr),
          fetchClientesConDeuda(negocioId),
        ]);
        if (cancelado) return;

        setVentasPeriodo(ventas);
        setVentasPrev(prevVentas);
        setGastosPeriodo(gastos);
        setClientesConDeuda(deuda);

        const detalle = await fetchDetalleVentasPorIds(negocioId, ventas.map((v) => v.id));
        if (!cancelado) setDetalleVentas(detalle);
      } catch (e) {
        console.error(e);
        if (!cancelado) toast.error('No se pudieron cargar las estadísticas');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [negocioId, period, customFrom, customTo, esperandoFechaPersonalizada]);

  // KPIs
  const totalFacturado = useMemo(() => ventasPeriodo.reduce((s, v) => s + v.precio, 0), [ventasPeriodo]);
  const totalFacturadoPrev = useMemo(() => ventasPrev.reduce((s, v) => s + v.precio, 0), [ventasPrev]);
  const cantidadVentas = ventasPeriodo.length;
  const ticketPromedio = cantidadVentas > 0 ? totalFacturado / cantidadVentas : 0;
  const totalGastos = useMemo(() => gastosPeriodo.reduce((s, g) => s + Number(g.monto), 0), [gastosPeriodo]);
  const ganancia = totalFacturado - totalGastos;
  const margen = totalFacturado > 0 ? (ganancia / totalFacturado) * 100 : 0;
  const crecimiento = totalFacturadoPrev > 0
    ? ((totalFacturado - totalFacturadoPrev) / totalFacturadoPrev) * 100
    : (totalFacturado > 0 ? 100 : 0);

  // Pedidos (ya vienen de Supabase vía el store)
  const pedidosPendientes = pedidos.filter((p) => p.estado === 'pendiente').length;
  const pedidosSubidos = pedidos.filter((p) => p.estado === 'subido').length;
  const pedidosEntregados = pedidos.filter((p) => p.estado === 'entregado').length;

  // Clientes
  const clientesActivosIds = useMemo(() => new Set(ventasPeriodo.map((v) => v.clienteId)), [ventasPeriodo]);
  const clientesNuevos = useMemo(() => {
    const fromStr = toISODate(range.from);
    const toStr = toISODate(range.to);
    return clientes.filter((c) => c.fechaAlta >= fromStr && c.fechaAlta <= toStr).length;
  }, [clientes, range]);

  const topClientes = useMemo(() => {
    const map: Record<string, { id: string; monto: number; count: number }> = {};
    ventasPeriodo.forEach((v) => {
      if (!map[v.clienteId]) map[v.clienteId] = { id: v.clienteId, monto: 0, count: 0 };
      map[v.clienteId].monto += v.precio;
      map[v.clienteId].count += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.monto - a.monto)
      .slice(0, 5)
      .map((x) => {
        const c = clientes.find((cl) => cl.id === x.id);
        return { nombre: c ? `${c.nombre} ${c.apellido}` : 'Cliente', monto: x.monto, count: x.count };
      });
  }, [ventasPeriodo, clientes]);

  // Productos (desde venta_detalle, correcto para ventas con varios productos)
  const topProductos = useMemo(() => {
    const map: Record<string, { nombre: string; cantidad: number; monto: number }> = {};
    detalleVentas.forEach((d) => {
      if (!map[d.productoId]) map[d.productoId] = { nombre: d.productoNombre, cantidad: 0, monto: 0 };
      map[d.productoId].cantidad += d.cantidad;
      map[d.productoId].monto += d.subtotal;
    });
    return Object.values(map).sort((a, b) => b.monto - a.monto);
  }, [detalleVentas]);

  const productosPorVenta = useMemo(() => {
    const map: Record<string, string> = {};
    detalleVentas.forEach((d) => {
      const linea = `${d.productoNombre} x${d.cantidad}`;
      map[d.ventaId] = map[d.ventaId] ? `${map[d.ventaId]}; ${linea}` : linea;
    });
    return map;
  }, [detalleVentas]);

  const bidonesEntregados = ventasPeriodo.reduce((s, v) => s + (v.entregamos || 0), 0);
  const bidonesRetirados = ventasPeriodo.reduce((s, v) => s + (v.llevamos || 0), 0);

  // Formas de pago
  const pagosData = useMemo(() => {
    const map: Record<string, number> = {};
    ventasPeriodo.forEach((v) => {
      map[v.formaPago] = (map[v.formaPago] || 0) + v.precio;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [ventasPeriodo]);

  const cobrado = ventasPeriodo.filter((v) => v.estadoPago === 'pagado').reduce((s, v) => s + v.precio, 0);
  const pendienteCobro = ventasPeriodo.filter((v) => v.estadoPago === 'pendiente').reduce((s, v) => s + v.precio, 0);

  // Serie temporal ventas por dia
  const serieVentas = useMemo(() => {
    const days = eachDayOfInterval({ start: range.from, end: range.to });
    if (days.length > 62) {
      const byMonth: Record<string, number> = {};
      ventasPeriodo.forEach((v) => {
        const d = parseISO(v.fecha.length === 10 ? `${v.fecha}T12:00:00` : v.fecha);
        const key = format(d, 'yyyy-MM');
        byMonth[key] = (byMonth[key] || 0) + v.precio;
      });
      return Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, monto]) => ({ fecha: format(parseISO(`${key}-01`), 'MMM yy', { locale: es }), monto }));
    }
    return days.map((d) => {
      const key = toISODate(d);
      const monto = ventasPeriodo
        .filter((v) => v.fecha.slice(0, 10) === key)
        .reduce((s, v) => s + v.precio, 0);
      return { fecha: format(d, days.length > 14 ? 'd MMM' : 'EEE d', { locale: es }), monto };
    });
  }, [ventasPeriodo, range]);

  const exportCSV = () => {
    const headers = ['Fecha', 'Cliente', 'Productos', 'Precio', 'Forma de Pago', 'Estado'];
    const filas = ventasPeriodo.map((v) => {
      const c = clientes.find((cl) => cl.id === v.clienteId);
      return [
        v.fecha,
        c ? `${c.nombre} ${c.apellido}` : '',
        productosPorVenta[v.id] || '',
        v.precio,
        v.formaPago,
        v.estadoPago,
      ];
    });
    const csv = [headers, ...filas]
      .map((fila) => fila.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estadisticas-${toISODate(range.from)}_a_${toISODate(range.to)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV descargado');
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Estadísticas</h1>
          <p className="text-sm text-muted-foreground">
            {esperandoFechaPersonalizada
              ? 'Elegí un rango de fechas para ver el detalle'
              : `${format(range.from, "d 'de' MMMM", { locale: es })} a ${format(range.to, "d 'de' MMMM yyyy", { locale: es })}`}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={period} onValueChange={(v) => handleSelectPeriod(v as PeriodKey)}>
            <SelectTrigger className="w-[170px] h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {period === 'personalizado' && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 shrink-0">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {customFrom
                    ? `${format(customFrom, 'dd/MM/yy')}${
                        customTo && toISODate(customTo) !== toISODate(customFrom)
                          ? ` - ${format(customTo, 'dd/MM/yy')}`
                          : ''
                      }`
                    : 'Elegir fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  locale={es}
                  selected={{ from: customFrom, to: customTo }}
                  onSelect={(r) => {
                    setCustomFrom(r?.from);
                    setCustomTo(r?.to ?? r?.from);
                  }}
                  numberOfMonths={1}
                  defaultMonth={customFrom}
                />
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline" onClick={exportCSV} className="h-10 shrink-0" disabled={cargando || esperandoFechaPersonalizada}>
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {esperandoFechaPersonalizada ? (
        <div className="stat-card text-center py-12 text-muted-foreground">
          <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p>Elegí una fecha o un rango en el calendario para ver las estadísticas</p>
        </div>
      ) : (
        <>
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
              subtitle={`${pedidosSubidos} subidos ${pedidosEntregados} entreg.`}
              icon={Clock}
              variant="warning"
            />
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
        </>
      )}
    </div>
  );
}
