import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/dashboard/StatCard';
import { DatePickerField } from '@/components/DatePickerField';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  CreditCard,
  Banknote,
  CalendarDays,
} from 'lucide-react';
import {
  fetchMovimientosCajaDia,
  fetchMovimientosCajaMes,
  fetchVentasPendientesDia,
} from '@/lib/api/caja';
import { useAuth } from '@/contexts/AuthContext';


const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;


export default function Caja() {
  const { negocioId } = useAuth();
  const [movimientosCaja, setMovimientosCaja] = useState<any[]>([]);
  const [movimientosMes, setMovimientosMes] = useState<any[]>([]);
  const [ventasPendientesDia, setVentasPendientesDia] = useState<{ id: string; precio: number }[]>([]);
  const [fechaSel, setFechaSel] = useState<Date>(() => {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12, 0, 0);
});
  useEffect(() => {
  if (!negocioId) return;

  fetchMovimientosCajaDia(negocioId, fechaSel)
    .then(setMovimientosCaja)
    .catch(console.error);
}, [negocioId, fechaSel]);

useEffect(() => {
  if (!negocioId) return;

  fetchMovimientosCajaMes(negocioId, fechaSel)
    .then(setMovimientosMes)
    .catch(console.error);
}, [negocioId, fechaSel]);

useEffect(() => {
  if (!negocioId) return;

  fetchVentasPendientesDia(negocioId, toKey(fechaSel))
    .then(setVentasPendientesDia)
    .catch(console.error);
}, [negocioId, fechaSel]);
   console.log('NEGOCIO ID:', negocioId);
   console.log('MOVIMIENTOS CAJA:', movimientosCaja);

  const now = fechaSel;
  const hoy = toKey(fechaSel);

  // Fecha efectiva de una venta: fechaPago si existe, si no fecha
  const fechaVenta = (v: { fecha: string; fechaPago?: string }) =>
    (v.fechaPago && v.fechaPago.trim() !== '' ? v.fechaPago : v.fecha).slice(0, 10);

  // ── Ingresos reales de Caja desde Supabase ───────────────────
const ventasEfectivoPagadas = movimientosCaja.filter(
  (m) =>
    m.tipo === 'ingreso' &&
    m.origen === 'venta' &&
    m.forma_pago === 'efectivo'
);

const ventasTransferenciaPagadas = movimientosCaja.filter(
  (m) =>
    m.tipo === 'ingreso' &&
    m.origen === 'venta' &&
    m.forma_pago === 'transferencia'
);

const ventasCuentaCorriente = movimientosCaja.filter(
  (m) =>
    m.tipo === 'ingreso' &&
    m.origen === 'venta' &&
    m.forma_pago === 'cuenta_corriente'
);

const ventasPagadas = movimientosCaja.filter(
  (m) => m.tipo === 'ingreso' && m.origen === 'venta'
);

const totalVentasEfectivo = ventasEfectivoPagadas.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const totalVentasTransferencia = ventasTransferenciaPagadas.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const totalVentasCuentaCorriente = ventasCuentaCorriente.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const totalVentasDia = ventasPagadas.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const totalVentasPendientes = ventasPendientesDia.reduce(
  (s, v) => s + Number(v.precio),
  0
);

 // ── Gastos reales de Caja desde Supabase ─────────────────────
const gastosEfectivo = movimientosCaja.filter(
  (m) =>
    m.tipo === 'egreso' &&
    m.origen === 'gasto' &&
    m.forma_pago === 'efectivo'
);

const gastosTransferencia = movimientosCaja.filter(
  (m) =>
    m.tipo === 'egreso' &&
    m.origen === 'gasto' &&
    m.forma_pago === 'transferencia'
);

const totalGastosEfectivo = gastosEfectivo.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const totalGastosTransferencia = gastosTransferencia.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const totalGastosDia = movimientosCaja
  .filter((m) => m.tipo === 'egreso' && m.origen === 'gasto')
  .reduce((s, m) => s + Number(m.monto), 0);

  // ── Netos del día ────────────────────────────────────────────
const netoEfectivo = totalVentasEfectivo - totalGastosEfectivo;
const netoTransferencia =
  totalVentasTransferencia - totalGastosTransferencia;

  // ── Resumen del mes ──────────────────────────────────────────
 const ventasMes = movimientosMes.filter(
  (m) => m.tipo === 'ingreso' && m.origen === 'venta'
);

const gastosMes = movimientosMes.filter(
  (m) => m.tipo === 'egreso' && m.origen === 'gasto'
);

const totalVentasMes = ventasMes.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const totalGastosMes = gastosMes.reduce(
  (s, m) => s + Number(m.monto),
  0
);

const netoMes = totalVentasMes - totalGastosMes;

  // Último día del mes
  const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const esUltimoDia = now.getDate() === ultimoDiaMes;
  const ahora = new Date();
  const esHoraCierre = ahora.getHours() >= 23 && ahora.getMinutes() >= 50;
  const mostrarResumenMes = esUltimoDia;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const nombreMes = now.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Caja del Día</h1>
        <p className="text-sm text-muted-foreground">
          {fechaSel.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Selector de fecha */}
      <div className="max-w-xs">
        <DatePickerField date={fechaSel} onDateChange={setFechaSel} label="Fecha" />
      </div>

      {/* Totales del día — 4 tarjetas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          title="Efectivo Neto"
          value={formatCurrency(netoEfectivo)}
          subtitle={`Ventas − Gastos`}
          icon={Banknote}
          variant={netoEfectivo >= 0 ? 'success' : 'warning'}
        />
        <StatCard
          title="Transferencias Neto"
          value={formatCurrency(netoTransferencia)}
          subtitle={`Ventas − Gastos`}
          icon={CreditCard}
          variant="default"
        />
        <StatCard
          title="Total Ventas"
          value={formatCurrency(totalVentasDia)}
          subtitle={`${ventasPagadas.length} ventas pagadas`}
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="Total Gastos"
          value={formatCurrency(totalGastosDia)}
          subtitle={`${gastosEfectivo.length + gastosTransferencia.length} gastos`}
          icon={TrendingDown}
          variant="warning"
        />
      </div>

      {/* Resultado Neto del día */}
      <div className="stat-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary" />
          <span className="font-medium">Resultado Neto</span>
        </div>
        <span className={`font-display font-bold text-xl ${totalVentasDia - totalGastosDia >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatCurrency(totalVentasDia - totalGastosDia)}
        </span>
      </div>

      {/* Detalle Ventas / Gastos */}
      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">

        {/* Ventas del Día */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-success" />
            <h2 className="font-display font-semibold text-base">Ventas del Día</h2>
          </div>

          <div className="space-y-3">
            {/* Efectivo */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-success" /> Efectivo
                </p>
                <p className="text-xs text-muted-foreground">{ventasEfectivoPagadas.length} venta{ventasEfectivoPagadas.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-success font-semibold">{formatCurrency(totalVentasEfectivo)}</span>
            </div>

            {/* Transferencia */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" /> Transferencia
                </p>
                <p className="text-xs text-muted-foreground">{ventasTransferenciaPagadas.length} venta{ventasTransferenciaPagadas.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-primary font-semibold">{formatCurrency(totalVentasTransferencia)}</span>
            </div>

            {/* Cuenta Corriente */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-muted-foreground" /> Cta. Corriente
                </p>
                <p className="text-xs text-muted-foreground">{ventasCuentaCorriente.length} venta{ventasCuentaCorriente.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="font-semibold">{formatCurrency(totalVentasCuentaCorriente)}</span>
            </div>

            {/* Pendientes */}
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-warning" /> Pendientes
                </p>
                <p className="text-xs text-muted-foreground">{ventasPendientesDia.length} venta{ventasPendientesDia.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-warning font-semibold">{formatCurrency(totalVentasPendientes)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="font-medium">Total Ventas</span>
              <span className="font-display font-bold">{formatCurrency(totalVentasDia)}</span>
            </div>
          </div>
        </div>

        {/* Gastos del Día */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-destructive" />
            <h2 className="font-display font-semibold text-base">Gastos del Día</h2>
          </div>

          <div className="space-y-3">
            {/* Efectivo */}
            <div className="flex justify-between items-center py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-destructive" /> Efectivo
                </p>
                <p className="text-xs text-muted-foreground">{gastosEfectivo.length} gasto{gastosEfectivo.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="text-destructive font-semibold">{formatCurrency(totalGastosEfectivo)}</span>
            </div>

            {/* Transferencia */}
            <div className="flex justify-between items-center py-2">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-muted-foreground" /> Transferencia
                </p>
                <p className="text-xs text-muted-foreground">{gastosTransferencia.length} gasto{gastosTransferencia.length !== 1 ? 's' : ''}</p>
              </div>
              <span className="font-semibold">{formatCurrency(totalGastosTransferencia)}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="font-medium">Total Gastos</span>
              <span className="font-display font-bold text-destructive">{formatCurrency(totalGastosDia)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen del Mes — siempre visible */}
      <div className={`stat-card ${esUltimoDia && esHoraCierre ? 'ring-2 ring-primary' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="font-display font-semibold text-base">
            Resumen del Mes
            {esUltimoDia && esHoraCierre && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Cierre de Mes
              </span>
            )}
          </h2>
          <span className="ml-auto text-sm text-muted-foreground capitalize">{nombreMes}</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Ventas</p>
            <p className="font-display font-bold text-success text-lg">{formatCurrency(totalVentasMes)}</p>
            <p className="text-xs text-muted-foreground">{ventasMes.length} ventas</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Gastos</p>
            <p className="font-display font-bold text-destructive text-lg">{formatCurrency(totalGastosMes)}</p>
            <p className="text-xs text-muted-foreground">{gastosMes.length} gastos</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Neto</p>
            <p className={`font-display font-bold text-lg ${netoMes >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {formatCurrency(netoMes)}
            </p>
            <p className="text-xs text-muted-foreground">resultado</p>
          </div>
        </div>

        {/* Desglose del mes por forma de pago */}
        <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1"><Banknote className="w-3.5 h-3.5" /> Efectivo mes</span>
            <span className="font-medium text-success">
              {formatCurrency(ventasMes.filter(v => v.formaPago === 'efectivo' && v.estadoPago === 'pagado').reduce((s, v) => s + v.precio, 0))}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1"><CreditCard className="w-3.5 h-3.5" /> Transfer. mes</span>
            <span className="font-medium text-primary">
              {formatCurrency(ventasMes.filter(v => v.formaPago === 'transferencia' && v.estadoPago === 'pagado').reduce((s, v) => s + v.precio, 0))}
            </span>
          </div>
        </div>

        {esUltimoDia && esHoraCierre && (
          <div className="mt-4 pt-4 border-t border-primary/30 bg-primary/5 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-primary">🎉 Fin de mes — Resumen final</p>
            <p className="text-xs text-muted-foreground mt-1">
              {ventasMes.length} ventas · {gastosMes.length} gastos · Neto {formatCurrency(netoMes)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
