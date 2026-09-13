import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Cliente } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, Package, Loader2, Pencil, Check, X, ShoppingCart } from 'lucide-react';
import { productos } from '@/data/mockData';
import { getVentas } from '@/lib/api/googleSheets';

const norm = (s?: string) => (s || '').trim().toLowerCase();

const stockAjusteKey = (id: string) => `stockAjuste_${id}`;

const getStockAjuste = (id: string): number => {
  const v = localStorage.getItem(stockAjusteKey(id));
  return v ? parseInt(v) || 0 : 0;
};

const setStockAjuste = (id: string, ajuste: number) => {
  localStorage.setItem(stockAjusteKey(id), String(ajuste));
};

interface ClienteProfileProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatMes = (fecha: string) => {
  const d = new Date(fecha + (fecha.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' });
};

const formatFecha = (fecha: string) => {
  const d = new Date(fecha + (fecha.length === 10 ? 'T12:00:00' : ''));
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
};

const getIniciales = (nombre: string, apellido: string) =>
  `${(nombre || '').charAt(0)}${(apellido || '').charAt(0)}`.toUpperCase();

export function ClienteProfile({ cliente, open, onOpenChange }: ClienteProfileProps) {
  const navigate = useNavigate();
  const ventas = useStore((s) => s.ventas);
  const [sheetVentas, setSheetVentas] = useState<any[] | null>(null);
  const [loadingSheet, setLoadingSheet] = useState(false);

  // Editing stock state
  const [editandoStock, setEditandoStock] = useState(false);
  const [stockInput, setStockInput] = useState('');
  const [ajuste, setAjuste] = useState(0);

  // Read sales from Google Sheets to get the real "entregamos" (stock) and payment status
  useEffect(() => {
    if (!open || !cliente) return;
    setAjuste(getStockAjuste(cliente.id));
    setEditandoStock(false);
    let cancelled = false;
    setLoadingSheet(true);
    getVentas()
      .then((res) => {
        if (cancelled) return;
        setSheetVentas(res.data || []);
      })
      .catch(() => {
        if (!cancelled) setSheetVentas(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSheet(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, cliente]);

  const stats = useMemo(() => {
    if (!cliente) return null;
    const ventasCliente = ventas
      .filter((v) => v.clienteId === cliente.id)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const entregasTotales = ventasCliente.length;

    // Match this client's rows from the Google Sheet (human-readable: nombre + apellido)
    const ventasSheetCliente = (sheetVentas || []).filter(
      (v) => norm(v.nombre) === norm(cliente.nombre) && norm(v.apellido) === norm(cliente.apellido)
    );

    // Stock = total "entregamos" from Google Sheet + ajuste manual (clientes que ya poseen bidones)
    const stockSheet = ventasSheetCliente.reduce(
      (s, v) => s + (parseInt(v.entregamos) || 0),
      0
    );
    const stockEnCliente = stockSheet + ajuste;

    // Precio/bidón tomado del Google Sheet (columna precio en ventas)
    const totalPrecioSheet = ventasSheetCliente.reduce(
      (s, v) => s + (parseFloat(v.precio) || 0),
      0
    );
    const totalEntregadosSheet = ventasSheetCliente.reduce(
      (s, v) => s + (parseInt(v.entregamos) || 0),
      0
    );
    const precioPromedio =
      totalEntregadosSheet > 0
        ? Math.round(totalPrecioSheet / totalEntregadosSheet)
        : 0;

    // Debt status taken from Google Sheet payment status (pendiente vs pagado)
    const deuda = ventasSheetCliente
      .filter((v) => norm(v.estadoPago) === 'pendiente')
      .reduce((s, v) => s + (parseFloat(v.precio) || 0), 0);

    return {
      ventasCliente,
      entregasTotales,
      stockSheet,
      stockEnCliente,
      deuda,
      precioPromedio,
    };
  }, [cliente, ventas, sheetVentas, ajuste]);


  if (!cliente || !stats) return null;

  const getProductoNombre = (id: string) =>
    productos.find((p) => p.id === id)?.nombre || '';

  const iniciarEdicion = () => {
    setStockInput(String(stats.stockEnCliente));
    setEditandoStock(true);
  };

  const guardarStock = () => {
    const nuevoStock = parseInt(stockInput);
    if (!isNaN(nuevoStock)) {
      const nuevoAjuste = nuevoStock - stats.stockSheet;
      setStockAjuste(cliente.id, nuevoAjuste);
      setAjuste(nuevoAjuste);
    }
    setEditandoStock(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-md mx-auto p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Perfil de {cliente.nombre} {cliente.apellido}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[85vh]">
          <div className="p-5 space-y-5">
            {/* Avatar + nombre */}
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xl font-semibold">
                {getIniciales(cliente.nombre, cliente.apellido)}
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  {cliente.nombre} {cliente.apellido}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {cliente.direccion ? `${cliente.direccion} · ` : ''}
                  cliente desde {formatMes(cliente.fechaAlta)}
                </p>
              </div>
              {stats.deuda > 0 ? (
                <span className="inline-flex items-center rounded-full bg-destructive/10 px-3 py-1 text-sm font-medium text-destructive">
                  Debe ${stats.deuda.toLocaleString('es-AR')}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300">
                  Al día
                </span>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-xl font-bold">{stats.entregasTotales}</p>
                <p className="text-xs text-muted-foreground leading-tight">entregas totales</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center relative">
                {editandoStock ? (
                  <div className="flex flex-col items-center gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      value={stockInput}
                      onChange={(e) => setStockInput(e.target.value)}
                      className="h-9 text-center text-lg font-bold px-1"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="icon" className="h-7 w-7" onClick={guardarStock}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setEditandoStock(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={iniciarEdicion}
                      className="absolute top-1.5 right-1.5 text-muted-foreground hover:text-primary"
                      aria-label="Editar stock"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <p className="text-xl font-bold flex items-center justify-center gap-1">
                      <Package className="w-4 h-4" />
                      {loadingSheet && sheetVentas === null ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        stats.stockEnCliente
                      )}
                    </p>
                  </>
                )}
                <p className="text-xs text-muted-foreground leading-tight">bidones en stock</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-xl font-bold text-green-700 dark:text-green-400">
                  ${stats.precioPromedio.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">precio/bidón</p>
              </div>
            </div>

            {/* Acceso directo a Nueva Venta, con este cliente ya seleccionado */}
            <Button
              className="w-full h-11 text-base"
              onClick={() => {
                onOpenChange(false);
                navigate('/ventas', { state: { clienteId: cliente.id } });
              }}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Nueva Venta
            </Button>

            {/* Contacto */}
            <div className="space-y-2">
              {cliente.telefono && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${cliente.telefono}`} className="text-primary">
                    {cliente.telefono}
                  </a>
                </div>
              )}
              {cliente.direccion && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{cliente.direccion}</span>
                </div>
              )}
            </div>

            {/* Historial */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Historial de entregas
              </h3>
              {stats.ventasCliente.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Sin entregas registradas todavía.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {stats.ventasCliente.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2.5 gap-2">
                      <span className="text-sm text-muted-foreground w-14 shrink-0">
                        {formatFecha(v.fecha)}
                      </span>
                      <span className="text-sm flex-1">
                        {v.entregamos > 0 ? `${v.entregamos} ${v.entregamos === 1 ? 'bidón' : 'bidones'}` : getProductoNombre(v.productoId)}
                        {' · '}${(v.precio || 0).toLocaleString('es-AR')}
                      </span>
                      {v.estadoPago === 'pendiente' ? (
                        <span className="text-xs font-medium rounded-full bg-destructive/10 text-destructive px-2.5 py-0.5 shrink-0">
                          Debe
                        </span>
                      ) : (
                        <span className="text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2.5 py-0.5 shrink-0">
                          Cobrado
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
