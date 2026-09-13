import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  fetchVentasEfectivasDia,
  fetchCierrePorFecha,
  fetchHistorialCierres,
  abrirCajaDia,
  cerrarCajaDia,
  reabrirCajaDia,
  abrirTodasLasCajas,
} from '@/lib/api/cierreCaja';

const toISODate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount || 0);

const formatHora = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '—';

const formatFechaCorta = (fecha: string) =>
  new Date(`${fecha}T12:00:00`).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

export default function CierreCaja() {
  const { negocioId } = useAuth();
  const [fechaSel, setFechaSel] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  });

  const [ventasDelDia, setVentasDelDia] = useState<any[]>([]);
  const [cierreFecha, setCierreFecha] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);

  const fechaStr = toISODate(fechaSel);

  const cargarDatos = useCallback(async () => {
    if (!negocioId) return;
    setCargando(true);
    try {
      const [ventas, cierre, hist] = await Promise.all([
        fetchVentasEfectivasDia(negocioId, fechaStr),
        fetchCierrePorFecha(negocioId, fechaStr),
        fetchHistorialCierres(negocioId),
      ]);
      setVentasDelDia(ventas);
      setCierreFecha(cierre);
      setHistorial(hist);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar los datos de caja');
    } finally {
      setCargando(false);
    }
  }, [negocioId, fechaStr]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const resumen = useMemo(() => {
    let efectivo = 0;
    let transferencia = 0;
    let otros = 0;
    let pendiente = 0;
    let totalVendido = 0;

    ventasDelDia.forEach((v) => {
      const monto = Number(v.precio) || 0;
      totalVendido += monto;

      if (v.estado_pago === 'pagado') {
        if (v.forma_pago === 'efectivo') efectivo += monto;
        else if (v.forma_pago === 'transferencia') transferencia += monto;
        else otros += monto;
      } else {
        pendiente += monto;
      }
    });

    const totalCobrado = efectivo + transferencia + otros;
    const cantidadPendientes = ventasDelDia.filter((v) => v.estado_pago !== 'pagado').length;

    return {
      cantidadVentas: ventasDelDia.length,
      totalEfectivo: efectivo,
      totalTransferencia: transferencia,
      totalOtros: otros,
      totalPendiente: pendiente,
      totalVendido,
      totalCobrado,
      cantidadPendientes,
    };
  }, [ventasDelDia]);

  const estadoCaja: 'sin_abrir' | 'abierta' | 'cerrada' = !cierreFecha
    ? 'sin_abrir'
    : cierreFecha.estado === 'cerrado'
    ? 'cerrada'
    : 'abierta';

  const handleAbrir = async () => {
    if (!negocioId) return;
    if (estadoCaja === 'cerrada') {
      toast.error('La caja de esta fecha ya está cerrada');
      return;
    }
    try {
      await abrirCajaDia(negocioId, fechaStr);
      toast.success(`Caja del ${formatFechaCorta(fechaStr)} abierta`);
      cargarDatos();
    } catch (e) {
      console.error(e);
      toast.error('No se pudo abrir la caja');
    }
  };

  const handleCerrar = async () => {
    if (estadoCaja === 'cerrada') {
      toast.error('Ya existe un cierre para esta fecha');
      return;
    }
    if (estadoCaja === 'sin_abrir' || !cierreFecha) {
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
      try {
        await cerrarCajaDia(cierreFecha.id, resumen);
        toast.success('Caja cerrada correctamente');
        cargarDatos();
      } catch (e) {
        console.error(e);
        toast.error('No se pudo cerrar la caja');
      }
    }
  };

  const handleReabrir = async () => {
    if (!cierreFecha) return;
    if (confirm('¿Reabrir la caja de esta fecha? Vas a poder seguir cargando ventas.')) {
      try {
        await reabrirCajaDia(cierreFecha.id);
        toast.success('Caja reabierta');
        cargarDatos();
      } catch (e) {
        console.error(e);
        toast.error('No se pudo reabrir la caja');
      }
    }
  };

  const handleAbrirTodas = async () => {
    if (!negocioId) return;
    const cerradas = historial.filter((c) => c.estado === 'cerrado').length;
    if (cerradas === 0) {
      toast.info('No hay cajas cerradas');
      return;
    }
    if (confirm(`¿Abrir todas las cajas cerradas (${cerradas})?`)) {
      try {
        await abrirTodasLasCajas(negocioId);
        toast.success('Todas las cajas fueron abiertas.');
        cargarDatos();
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron abrir las cajas');
      }
    }
  };

  const descargarCSV = (registro?: any) => {
    const fila = registro
      ? {
          fecha: registro.fecha,
          horaApertura: formatHora(registro.hora_apertura),
          horaCierre: formatHora(registro.hora_cierre),
          cantidadVentas: registro.cantidad_ventas ?? 0,
          efectivo: registro.total_efectivo ?? 0,
          transferencias: registro.total_transferencia ?? 0,
          otros: registro.total_otros ?? 0,
          totalVentas: registro.total_vendido ?? 0,
          totalCobrado: registro.total_cobrado ?? 0,
          pendiente: registro.total_pendiente ?? 0,
          estado: registro.estado === 'cerrado' ? 'Cerrada' : 'Abierta',
        }
      : {
          fecha: fechaStr,
          horaApertura: formatHora(cierreFecha?.hora_apertura),
          horaCierre: formatHora(cierreFecha?.hora_cierre),
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

    const csv = [headers.join(','), valores.join(',')].join('\n');
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
        {historial.some((c) => c.estado === 'cerrado') && (
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
            {cierreFecha?.hora_apertura && (
              <span className="ml-auto text-xs text-muted-foreground">
                Apertura {formatHora(cierreFecha.hora_apertura)}
                {cierreFecha.hora_cierre && ` · Cierre ${formatHora(cierreFecha.hora_cierre)}`}
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
              <Button onClick={handleAbrir} className="w-full h-14 text-base" size="lg" disabled={cargando}>
                <Unlock className="w-5 h-5 mr-2" />
                ABRIR CAJA
              </Button>
            )}

            {estadoCaja === 'abierta' && (
              <Button onClick={handleCerrar} className="w-full h-14 text-base" size="lg" disabled={cargando}>
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
                disabled={cargando}
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
                    <span>Apertura: {formatHora(c.hora_apertura)}</span>
                    <span>Cierre: {formatHora(c.hora_cierre)}</span>
                    <span>Ventas: {c.cantidad_ventas ?? 0}</span>
                    <span>Efectivo: {formatCurrency(c.total_efectivo ?? 0)}</span>
                    <span>Transf.: {formatCurrency(c.total_transferencia ?? 0)}</span>
                    <span>Otros: {formatCurrency(c.total_otros ?? 0)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold">
                      Total: {formatCurrency(c.total_vendido ?? 0)}
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
