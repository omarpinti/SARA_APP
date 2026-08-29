import { useMemo, useState } from 'react';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { DatePickerField } from '@/components/DatePickerField';
import {
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';
import { CierreCaja as CierreCajaType, Venta } from '@/types';

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0);

const formatHora = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatFechaCorta = (fecha: string) =>
  new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

// Fecha efectiva de cobro: fechaPago si existe, si no la fecha de la venta
const fechaVenta = (v: Venta) => (v.fechaPago || v.fecha || '').slice(0, 10);

export default function CierreCaja() {
  const { ventas, cierres, abrirCajaDia, cerrarCajaDia, abrirCaja, abrirTodasLasCajas } = useStore();
  const [fechaSel, setFechaSel] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });

  const fechaStr = toISODate(fechaSel);

  // Ventas del día (sin duplicados por id)
  const ventasDelDia = useMemo(() => {
    const map = new Map<string, Venta>();
    ventas.forEach((v) => {
      if (fechaVenta(v) === fechaStr) map.set(v.id, v);
    });
    return Array.from(map.values());
  }, [ventas, fechaStr]);

  const resumen = useMemo(() => {
    let efectivo = 0;
    let transferencia = 0;
    let otros = 0;
    let pendiente = 0;
    let totalVendido = 0;

    ventasDelDia.forEach((v) => {
      const monto = v.precio || 0;
      totalVendido += monto;

      if (v.estadoPago === 'pagado') {
        if (v.formaPago === 'efectivo') efectivo += monto;
        else if (v.formaPago === 'transferencia') transferencia += monto;
        else otros += monto;
      } else {
        pendiente += monto;
      }
    });

    const totalCobrado = efectivo + transferencia + otros;
    const pendientes = ventasDelDia.filter((v) => v.estadoPago !== 'pagado');

    return {
      cantidadVentas: ventasDelDia.length,
      totalEfectivo: efectivo,
      totalTransferencia: transferencia,
      totalOtros: otros,
      totalPendiente: pendiente,
      totalVendido,
      totalCobrado,
      cantidadPendientes: pendientes.length,
    };
  }, [ventasDelDia]);

  const cierreFecha = cierres.find((c) => c.fecha === fechaStr);
  const estadoCaja: 'sin_abrir' | 'abierta' | 'cerrada' = !cierreFecha
    ? 'sin_abrir'
    : cierreFecha.estado === 'cerrado'
    ? 'cerrada'
    : 'abierta';

  const handleAbrir = () => {
    if (estadoCaja === 'cerrada') {
      toast.error('La caja de esta fecha ya está cerrada');
      return;
    }
    abrirCajaDia(fechaStr);
    toast.success(`Caja del ${formatFechaCorta(fechaStr)} abierta`);
  };

  const handleCerrar = () => {
    if (estadoCaja === 'cerrada') {
      toast.error('Ya existe un cierre para esta fecha');
      return;
    }
    if (estadoCaja === 'sin_abrir') {
      toast.error('Primero tenés que abrir la caja de esta fecha');
      return;
    }

    const detalle = [
      `Fecha: ${formatFechaCorta(fechaStr)}`,
      `Cantidad de ventas: ${resumen.cantidadVentas}`,
      `Efectivo: ${formatCurrency(resumen.totalEfectivo)}`,
      `Transferencias: ${formatCurrency(resumen.totalTransferencia)}`,
      `Otros medios: ${formatCurrency(resumen.totalOtros)}`,
      `Pendientes: ${formatCurrency(resumen.totalPendiente)}`,
      `Total vendido: ${formatCurrency(resumen.totalVendido)}`,
      `Total cobrado: ${formatCurrency(resumen.totalCobrado)}`,
      '',
      '¿Confirmás el cierre de caja?',
    ].join('\n');

    if (confirm(detalle)) {
      cerrarCajaDia(fechaStr, {
        cantidadVentas: resumen.cantidadVentas,
        totalEfectivo: resumen.totalEfectivo,
        totalTransferencia: resumen.totalTransferencia,
        totalOtros: resumen.totalOtros,
        totalVendido: resumen.totalVendido,
        totalCobrado: resumen.totalCobrado,
        totalPendiente: resumen.totalPendiente,
      });
      toast.success('Caja cerrada correctamente');
    }
  };

  const handleReabrir = () => {
    if (confirm('¿Reabrir la caja de esta fecha? Vas a poder seguir cargando ventas.')) {
      abrirCaja(fechaStr);
      toast.success('Caja reabierta');
    }
  };

  const handleAbrirTodas = () => {
    const cerradas = cierres.filter((c) => c.estado === 'cerrado').length;
    if (cerradas === 0) {
      toast.info('No hay cajas cerradas');
      return;
    }
    if (confirm(`¿Abrir todas las cajas cerradas (${cerradas})?`)) {
      abrirTodasLasCajas();
      toast.success('Todas las cajas fueron abiertas.');
    }
  };

  const descargarCSV = (registro?: CierreCajaType) => {
    const fila = registro
      ? {
          fecha: registro.fecha,
          horaApertura: formatHora(registro.horaApertura),
          horaCierre: formatHora(registro.horaCierre),
          cantidadVentas: registro.cantidadVentas ?? 0,
          efectivo: registro.totalEfectivo ?? 0,
          transferencias: registro.totalTransferencia ?? 0,
          otros: registro.totalOtros ?? 0,
          totalVentas: registro.totalVendido ?? 0,
          totalCobrado: registro.totalCobrado ?? 0,
          pendiente: registro.totalPendiente ?? 0,
          estado: registro.estado === 'cerrado' ? 'Cerrada' : 'Abierta',
        }
      : {
          fecha: fechaStr,
          horaApertura: formatHora(cierreFecha?.horaApertura),
          horaCierre: formatHora(cierreFecha?.horaCierre),
          cantidadVentas: resumen.cantidadVentas,
          efectivo: resumen.totalEfectivo,
          transferencias: resumen.totalTransferencia,
          otros: resumen.totalOtros,
          totalVentas: resumen.totalVendido,
          totalCobrado: resumen.totalCobrado,
          pendiente: resumen.totalPendiente,
          estado:
            estadoCaja === 'cerrada' ? 'Cerrada' : estadoCaja === 'abierta' ? 'Abierta' : 'Sin abrir',
        };

    const headers = [
      'Fecha',
      'Hora Apertura',
      'Hora Cierre',
      'Cantidad Ventas',
      'Efectivo',
      'Transferencias',
      'Otros Pagos',
      'Total Ventas',
      'Total Cobrado',
      'Pendiente de Pago',
      'Estado',
    ];

    const valores = [
      fila.fecha,
      fila.horaApertura,
      fila.horaCierre,
      fila.cantidadVentas,
      fila.efectivo,
      fila.transferencias,
      fila.otros,
      fila.totalVentas,
      fila.totalCobrado,
      fila.pendiente,
      fila.estado,
    ];

    const csv = '\uFEFF' + [headers.join(';'), valores.join(';')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cierre-caja-${fila.fecha}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV descargado');
  };

  const historial = [...cierres].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Cierre de Caja</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(`${fechaStr}T12:00:00`).toLocaleDateString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
        {cierres.some((c) => c.estado === 'cerrado') && (
          <Button
            onClick={handleAbrirTodas}
            variant="outline"
            size="sm"
            className="border-destructive text-destructive hover:bg-destructive/10"
          >
            <Unlock className="w-4 h-4 mr-1" />
            Abrir Todas
          </Button>
        )}
      </div>

      <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
        {/* Caja de la fecha */}
        <div className="stat-card space-y-4">
          <DatePickerField date={fechaSel} onDateChange={setFechaSel} label="Fecha de caja" />

          <div className="flex items-center gap-2">
            {estadoCaja === 'cerrada' ? (
              <Lock className="w-5 h-5 text-success" />
            ) : (
              <Unlock className="w-5 h-5 text-warning" />
            )}
            <h2 className="font-display font-semibold text-base">
              {estadoCaja === 'cerrada'
                ? 'Caja Cerrada'
                : estadoCaja === 'abierta'
                ? 'Caja Abierta'
                : 'Caja sin abrir'}
            </h2>
            {cierreFecha?.horaApertura && (
              <span className="ml-auto text-xs text-muted-foreground">
                Apertura {formatHora(cierreFecha.horaApertura)}
                {cierreFecha.horaCierre && ` · Cierre ${formatHora(cierreFecha.horaCierre)}`}
              </span>
            )}
          </div>

          {estadoCaja === 'sin_abrir' && (
            <div className="flex items-start gap-3 p-4 bg-warning/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Caja sin abrir</p>
                <p className="text-sm text-muted-foreground">
                  Abrí la caja para registrar la apertura de esta fecha. Los totales se actualizan solos.
                </p>
              </div>
            </div>
          )}

          {estadoCaja === 'cerrada' && (
            <div className="flex items-center gap-3 p-4 bg-success/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-success shrink-0" />
              <div>
                <p className="font-medium">Cierre registrado</p>
                <p className="text-sm text-muted-foreground">
                  No se pueden cargar ventas en esta fecha
                </p>
              </div>
            </div>
          )}

          {/* Resumen del día */}
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Cantidad de ventas</span>
              <span className="font-medium">{resumen.cantidadVentas}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Efectivo</span>
              <span className="font-medium text-success">{formatCurrency(resumen.totalEfectivo)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Transferencias</span>
              <span className="font-medium">{formatCurrency(resumen.totalTransferencia)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Otros medios</span>
              <span className="font-medium">{formatCurrency(resumen.totalOtros)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">
                Pendientes de pago {resumen.cantidadPendientes > 0 && `(${resumen.cantidadPendientes})`}
              </span>
              <span className="font-medium text-warning">{formatCurrency(resumen.totalPendiente)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">Total vendido</span>
              <span className="font-medium">{formatCurrency(resumen.totalVendido)}</span>
            </div>
            <div className="flex justify-between py-3 bg-primary/5 rounded-lg px-3">
              <span className="font-semibold">Total cobrado</span>
              <span className="font-display font-bold text-lg">
                {formatCurrency(resumen.totalCobrado)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {estadoCaja === 'sin_abrir' && (
              <Button onClick={handleAbrir} className="w-full h-14 text-base" size="lg">
                <Unlock className="w-5 h-5 mr-2" />
                ABRIR CAJA
              </Button>
            )}

            {estadoCaja === 'abierta' && (
              <Button onClick={handleCerrar} className="w-full h-14 text-base" size="lg">
                <Lock className="w-5 h-5 mr-2" />
                CERRAR CAJA
              </Button>
            )}

            {estadoCaja === 'cerrada' && (
              <Button
                onClick={handleReabrir}
                variant="outline"
                className="w-full h-14 text-base border-warning text-warning hover:bg-warning/10"
                size="lg"
              >
                <Unlock className="w-5 h-5 mr-2" />
                Reabrir Caja
              </Button>
            )}

            <Button
              onClick={() => descargarCSV(estadoCaja === 'cerrada' ? cierreFecha : undefined)}
              variant="outline"
              className="w-full h-12 text-base"
            >
              <Download className="w-4 h-4 mr-2" />
              DESCARGAR CSV
            </Button>
          </div>
        </div>

        {/* Historial */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-display font-semibold text-base">Historial de Cierres de Caja</h2>
          </div>

          {historial.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>No hay cierres registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((c) => (
                <div key={c.id} className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{formatFechaCorta(c.fecha)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        c.estado === 'cerrado'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {c.estado === 'cerrado' ? 'Cerrada' : 'Abierta'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Apertura: {formatHora(c.horaApertura)}</span>
                    <span>Cierre: {formatHora(c.horaCierre)}</span>
                    <span>Ventas: {c.cantidadVentas ?? 0}</span>
                    <span>Efectivo: {formatCurrency(c.totalEfectivo ?? 0)}</span>
                    <span>Transf.: {formatCurrency(c.totalTransferencia ?? 0)}</span>
                    <span>Otros: {formatCurrency(c.totalOtros ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold">
                      Total: {formatCurrency(c.totalVendido ?? 0)}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => descargarCSV(c)}>
                      <Download className="w-4 h-4 mr-1" />
                      CSV
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
