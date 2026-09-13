import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cliente } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchVentasCompletas } from '@/lib/api/registrarVenta';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

import {
  MapPin,
  Loader2,
  ShoppingCart,
} from 'lucide-react';

interface ClienteProfileProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatMes = (fecha: string) => {
  const fechaCompleta =
    fecha.length === 10
      ? fecha + 'T12:00:00'
      : fecha;

  const fechaObj = new Date(fechaCompleta);

  return fechaObj.toLocaleDateString('es-AR', {
    month: 'short',
    year: 'numeric',
  });
};

const formatFecha = (fecha: string) => {
  const fechaCompleta =
    fecha.length === 10
      ? fecha + 'T12:00:00'
      : fecha;

  const fechaObj = new Date(fechaCompleta);

  return fechaObj.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
  });
};

const getIniciales = (
  nombre: string,
  apellido: string
) => {
  const inicialNombre =
    (nombre || '').charAt(0);

  const inicialApellido =
    (apellido || '').charAt(0);

  return (
    inicialNombre + inicialApellido
  ).toUpperCase();
};

function ClienteProfile({
  cliente,
  open,
  onOpenChange,
}: ClienteProfileProps) {
  const navigate = useNavigate();
  const { negocioId } = useAuth();

  const [ventasDb, setVentasDb] = useState<any[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);

  useEffect(() => {
    if (!open || !cliente || !negocioId) {
      return;
    }

    let cancelado = false;

    setLoadingVentas(true);

    fetchVentasCompletas(negocioId)
      .then((ventas) => {
        if (cancelado) {
          return;
        }

        const ventasCliente = ventas.filter(
          (venta: any) =>
            venta.cliente_id === cliente.id
        );

        setVentasDb(ventasCliente);
      })
      .catch((error) => {
        console.error(
          'Error cargando ventas del cliente:',
          error
        );

        if (!cancelado) {
          setVentasDb([]);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setLoadingVentas(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [open, cliente, negocioId]);

  const stats = useMemo(() => {
    if (!cliente) {
      return null;
    }

    const ventasCliente = [...ventasDb].sort(
      (a, b) =>
        String(b.fecha).localeCompare(
          String(a.fecha)
        )
    );

    /*
     * Cada venta registrada cuenta como una entrega.
     */
    const entregasTotales =
      ventasCliente.length;

    /*
     * PRODUCTOS EN STOCK
     *
     * Cantidad:
     * ventas.entregamos
     *
     * Producto:
     * ventas.producto.nombre
     *
     * Respaldo:
     * venta_detalle[0].producto.nombre
     */
    const productosStockMap = new Map<
      string,
      {
        nombre: string;
        cantidad: number;
      }
    >();

    ventasCliente.forEach((venta: any) => {
      const cantidad =
        Number(venta.entregamos) || 0;

      if (cantidad <= 0) {
        return;
      }

      let nombreProducto = 'Producto';

      if (
        venta.producto &&
        venta.producto.nombre
      ) {
        nombreProducto =
          venta.producto.nombre;
      } else if (
        venta.venta_detalle &&
        venta.venta_detalle.length > 0 &&
        venta.venta_detalle[0].producto &&
        venta.venta_detalle[0].producto.nombre
      ) {
        nombreProducto =
          venta.venta_detalle[0].producto.nombre;
      }

      const productoActual =
        productosStockMap.get(
          nombreProducto
        );

      if (productoActual) {
        productoActual.cantidad =
          productoActual.cantidad +
          cantidad;
      } else {
        productosStockMap.set(
          nombreProducto,
          {
            nombre: nombreProducto,
            cantidad: cantidad,
          }
        );
      }
    });

    const productosStock =
      Array.from(
        productosStockMap.values()
      );

    /*
     * CUENTA TOTAL
     */
    const totalCuenta =
      ventasCliente.reduce(
        (total, venta) => {
          return (
            total +
            (Number(venta.precio) || 0)
          );
        },
        0
      );

    /*
     * VENTAS PENDIENTES
     */
    const ventasPendientes =
      ventasCliente.filter(
        (venta: any) =>
          String(
            venta.estado_pago || ''
          ).toLowerCase() === 'pendiente'
      );

    /*
     * DEUDA TOTAL
     */
    const deuda =
      ventasPendientes.reduce(
        (total, venta) => {
          return (
            total +
            (Number(venta.precio) || 0)
          );
        },
        0
      );

    const cuentaPagada =
      ventasCliente.length > 0 &&
      deuda === 0;

    return {
      ventasCliente,
      entregasTotales,
      productosStock,
      totalCuenta,
      deuda,
      cuentaPagada,
    };
  }, [cliente, ventasDb]);

  if (!cliente || !stats) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-0 overflow-hidden">

        <DialogHeader className="sr-only">
          <DialogTitle>
            Perfil de {cliente.nombre}{' '}
            {cliente.apellido}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh]">

          <div className="p-5 space-y-5">

            {/* PERFIL */}

            <div className="flex flex-col items-center text-center gap-2">

              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xl font-semibold">
                {getIniciales(
                  cliente.nombre,
                  cliente.apellido
                )}
              </div>

              <div>

                <h2 className="text-xl font-semibold tracking-tight">
                  {cliente.nombre}{' '}
                  {cliente.apellido}
                </h2>

                {cliente.direccion && (
                  <div className="flex items-center justify-center gap-1 mt-1 text-sm text-muted-foreground">

                    <MapPin className="w-4 h-4" />

                    <span>
                      {cliente.direccion}
                    </span>

                  </div>
                )}

                <p className="text-sm text-muted-foreground mt-1">
                  cliente desde{' '}
                  {formatMes(
                    cliente.fechaAlta
                  )}
                </p>

              </div>

            </div>

            {/* PRODUCTOS EN STOCK */}

            {stats.productosStock.length > 0 && (

              <div>

                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  Productos en stock
                </h3>

                <div className="space-y-2">

                  {stats.productosStock.map(
                    (producto) => (

                      <div
                        key={producto.nombre}
                        className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2"
                      >

                        <span className="text-sm">
                          {producto.nombre}
                        </span>

                        <span className="text-sm font-semibold">
                          {producto.cantidad}
                        </span>

                      </div>

                    )
                  )}

                </div>

              </div>

            )}

            {/* NUEVA VENTA */}

            <Button
              className="w-full h-11 text-base"
              onClick={() => {

                onOpenChange(false);

                navigate('/ventas', {
                  state: {
                    clienteId:
                      cliente.id,
                  },
                });

              }}
            >

              <ShoppingCart className="w-5 h-5 mr-2" />

              Nueva Venta

            </Button>

            {/* HISTORIAL */}

            <div>

              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Historial de entregas
              </h3>

              {loadingVentas ? (

                <div className="flex justify-center py-5">

                  <Loader2 className="w-5 h-5 animate-spin" />

                </div>

              ) : stats.ventasCliente.length === 0 ? (

                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin entregas registradas todavía.
                </p>

              ) : (

                <div className="divide-y divide-border">

                  {stats.ventasCliente.map(
                    (venta: any) => {

                      const cantidad =
                        Number(
                          venta.entregamos
                        ) || 0;

                      let productoNombre =
                        'Producto';

                      if (
                        venta.producto &&
                        venta.producto.nombre
                      ) {
                        productoNombre =
                          venta.producto.nombre;
                      } else if (
                        venta.venta_detalle &&
                        venta.venta_detalle.length > 0 &&
                        venta.venta_detalle[0].producto &&
                        venta.venta_detalle[0].producto.nombre
                      ) {
                        productoNombre =
                          venta
                            .venta_detalle[0]
                            .producto
                            .nombre;
                      }

                      const estadoPago =
                        String(
                          venta.estado_pago ||
                            ''
                        ).toLowerCase();

                      const pendiente =
                        estadoPago ===
                        'pendiente';

                      const precio =
                        Number(
                          venta.precio
                        ) || 0;

                      return (

                        <div
                          key={venta.id}
                          className="flex items-center justify-between py-2.5 gap-2"
                        >

                          <span className="text-sm text-muted-foreground w-14 shrink-0">
                            {formatFecha(
                              venta.fecha
                            )}
                          </span>

                          <span className="text-sm flex-1">

                            {cantidad > 0
                              ? cantidad +
                                ' ' +
                                productoNombre
                              : productoNombre}

                            {' · '}

                            $
                            {precio.toLocaleString(
                              'es-AR'
                            )}

                          </span>

                          {pendiente ? (

                            <span className="text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2.5 py-0.5 shrink-0">
                              Pendiente
                            </span>

                          ) : (

                            <span className="text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2.5 py-0.5 shrink-0">
                              Pagado
                            </span>

                          )}

                        </div>

                      );
                    }
                  )}

                </div>

              )}

            </div>

          </div>

        </ScrollArea>

      </DialogContent>
    </Dialog>
  );
}

export { ClienteProfile };

export default ClienteProfile;
