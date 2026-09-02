import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  registrarVentaCompleta,
  fetchVentasCompletas,
  eliminarVentaCompleta,
  actualizarVentaCompleta,
} from '@/lib/api/registrarVenta';

import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Plus, Search, ShoppingCart, Trash2, CreditCard, Pencil, Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchPromociones,
  type PromocionAdmin,
} from '@/lib/api/promociones';
import { fetchProductos } from '@/lib/api/productos';
import { FormaPago, EstadoPago, type Producto} from '@/types';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card';
import { DatePickerField } from '@/components/DatePickerField';
import {
  fetchPromocionDetalles,
  type PromocionDetalleAdmin,
} from '@/lib/api/promocionDetalle';
type ItemVenta = {
  id: string;
  tipo: 'producto' | 'promocion';
  productoId: string;
  promocionId?: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};
const emptyForm = {
  fecha: new Date(),
  fechaPago: new Date(),
  clienteId: '',
  productoId: '',
  promocionId: '',
  precio: 0,
  cantidad: 1,
  formaPago: 'efectivo' as FormaPago,
  estadoPago: 'pagado' as EstadoPago,
  entregamos: 0,
  llevamos: 0,
  observaciones: '',
};

export default function Ventas() {
  const { negocioId } = useAuth();
  const { clientes, ventas, addVenta, updateVenta, deleteVenta, isCajaCerrada } = useStore();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemsVenta, setItemsVenta] = useState<ItemVenta[]>([]);
  const [ventasDb, setVentasDb] = useState<any[]>([]);
  const totalVenta = itemsVenta.reduce((total, item) => total + item.subtotal,0);
  function agregarItemVenta() {
  if (!formData.productoId && !formData.promocionId) {
    toast.error('Seleccioná un producto');
    return;
  }

  const cantidad = Math.max(1, formData.cantidad);

  if (formData.promocionId) {
    const promo = promociones.find(
      (p) => p.id === formData.promocionId
    );

    const detalle =
      detallesPromociones[formData.promocionId]?.[0];

    if (!promo || !detalle) {
      toast.error('No se pudo cargar la promoción');
      return;
    }

    const precio = detalle.precioPromocional;

    const nuevoItem: ItemVenta = {
      id: `promo-${promo.id}-${Date.now()}`,
      tipo: 'promocion',
      productoId: detalle.productoId,
      promocionId: promo.id,
      nombre: promo.descripcion || promo.nombre,
      cantidad,
      precioUnitario: precio,
      subtotal: precio * cantidad,
    };

    setItemsVenta((actuales) => [...actuales, nuevoItem]);
  } else {
    const producto = productos.find(
      (p) => p.id === formData.productoId
    );

    if (!producto) {
      toast.error('No se encontró el producto');
      return;
    }

    const precio = producto.precioDefault;

    const nuevoItem: ItemVenta = {
      id: `producto-${producto.id}-${Date.now()}`,
      tipo: 'producto',
      productoId: producto.id,
      nombre: producto.nombre,
      cantidad,
      precioUnitario: precio,
      subtotal: precio * cantidad,
    };

    setItemsVenta((actuales) => [...actuales, nuevoItem]);
  }

  setFormData((actual) => ({
    ...actual,
    productoId: '',
    promocionId: '',
    precio: 0,
    cantidad: 1,
  }));
}
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promociones, setPromociones] = useState<PromocionAdmin[]>([]);
  const [detallesPromociones, setDetallesPromociones] = useState<
  Record<string, PromocionDetalleAdmin[]>
>({});

  const hoy = new Date().toISOString().split('T')[0];
  const cajaCerrada = isCajaCerrada(hoy);

  const [formData, setFormData] = useState({ ...emptyForm });
  useEffect(() => {
  async function cargarCatalogo() {
    if (!negocioId) return;

    try {
      const productosData = await fetchProductos(negocioId);

      setProductos(
        productosData.filter((p) => p.activo)
      );

      const promocionesData = await fetchPromociones(negocioId);

      const promocionesActivas = promocionesData.filter(
        (p) => p.activa
      );

      setPromociones(promocionesActivas);

      const detallesArray = await Promise.all(
        promocionesActivas.map(async (promo) => {
          const detalles = await fetchPromocionDetalles(promo.id);

          return {
            promocionId: promo.id,
            detalles,
          };
        })
      );

      const detallesPorPromocion: Record<
        string,
        PromocionDetalleAdmin[]
      > = {};

      detallesArray.forEach((item) => {
        detallesPorPromocion[item.promocionId] = item.detalles;
      });

      setDetallesPromociones(detallesPorPromocion);

    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar el catálogo');
    }
  }

  cargarCatalogo();
}, [negocioId]);



useEffect(() => {
  async function cargarVentas() {
    if (!negocioId) return;

    try {
      const data = await fetchVentasCompletas(negocioId);

      const ventasMapeadas = data.map((venta: any) => ({
        id: venta.id,
        fecha: venta.fecha,
        fechaPago: venta.fecha_pago,
        clienteId: venta.cliente_id,
        productoId: venta.producto_id,
        promocionId: venta.promocion_id || undefined,
        precio: Number(venta.precio || 0),
        formaPago: venta.forma_pago,
        estadoPago: venta.estado_pago,
        entregamos: venta.entregamos || 0,
        llevamos: venta.llevamos || 0,
        observaciones: venta.observaciones || '',
        detalles: venta.venta_detalle || [],
      }));

      setVentasDb(ventasMapeadas);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    }
  }

  cargarVentas();
}, [negocioId]);

// Si llegamos desde "Nueva Venta" en Clientes...

  // Si llegamos desde "Nueva Venta" en Clientes (con un cliente ya elegido),
  // lo precargamos y abrimos el formulario. No afecta el uso normal de esta pantalla.
  const location = useLocation();
  const clienteIdAplicado = useRef(false);
  useEffect(() => {
    const clienteId = (location.state as { clienteId?: string } | null)?.clienteId;
    if (clienteId && !clienteIdAplicado.current) {
      clienteIdAplicado.current = true;
      setFormData((prev) => ({ ...prev, clienteId }));
      setIsOpen(true);
    }
  }, [location.state]);

  const filteredVentas = ventasDb
    .filter((v) => {
      const cliente = clientes.find((c) => c.id === v.clienteId);
      if (!cliente || (!cliente.nombre && !cliente.apellido)) return false;

      if (!search) return true;
      const nombre = cliente.nombre?.toLowerCase() || '';
      const apellido = cliente.apellido?.toLowerCase() || '';
      return nombre.includes(search.toLowerCase()) || apellido.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const dateCompare = b.fecha.localeCompare(a.fecha);
      if (dateCompare !== 0) return dateCompare;
      return b.id.localeCompare(a.id);
    });

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const y = formData.fecha.getFullYear();
  const m = String(formData.fecha.getMonth() + 1).padStart(2, '0');
  const d = String(formData.fecha.getDate()).padStart(2, '0');
  const fechaStr = `${y}-${m}-${d}`;

  if (isCajaCerrada(fechaStr)) {
    toast.error('La caja de ese día está cerrada');
    return;
  }

  if (!negocioId) {
    toast.error('No se encontró el negocio');
    return;
  }

  if (!formData.clienteId) {
    toast.error('Seleccioná un cliente');
    return;
  }

  if (itemsVenta.length === 0) {
    toast.error('Agregá al menos un producto');
    return;
  }

  const fechaPago = formData.fechaPago;
  const fpY = fechaPago.getFullYear();
  const fpM = String(fechaPago.getMonth() + 1).padStart(2, '0');
  const fpD = String(fechaPago.getDate()).padStart(2, '0');
  const fechaPagoStr = `${fpY}-${fpM}-${fpD}`;

 try {
  const itemsGuardar = itemsVenta.map((item) => ({
    productoId: item.productoId,
    promocionId: item.promocionId,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
    subtotal: item.subtotal,
  }));

  if (editingId) {
    await actualizarVentaCompleta(editingId, {
      negocioId,
      clienteId: formData.clienteId,
      fecha: fechaStr,
      fechaPago: fechaPagoStr,
      formaPago: formData.formaPago,
      estadoPago: formData.estadoPago,
      entregamos: formData.entregamos,
      llevamos: formData.llevamos,
      observaciones: formData.observaciones,
      items: itemsGuardar,
    });

    toast.success('Venta actualizada');
  } else {
    await registrarVentaCompleta({
      negocioId,
      clienteId: formData.clienteId,
      fecha: fechaStr,
      fechaPago: fechaPagoStr,
      formaPago: formData.formaPago,
      estadoPago: formData.estadoPago,
      entregamos: formData.entregamos,
      llevamos: formData.llevamos,
      observaciones: formData.observaciones,
      items: itemsGuardar,
    });

    toast.success('Venta registrada');
  }

  const dataActualizada = await fetchVentasCompletas(negocioId);

  const ventasMapeadas = dataActualizada.map((venta: any) => ({
    id: venta.id,
    fecha: venta.fecha,
    fechaPago: venta.fecha_pago,
    clienteId: venta.cliente_id,
    productoId: venta.producto_id,
    promocionId: venta.promocion_id || undefined,
    precio: Number(venta.precio || 0),
    formaPago: venta.forma_pago,
    estadoPago: venta.estado_pago,
    entregamos: venta.entregamos || 0,
    llevamos: venta.llevamos || 0,
    observaciones: venta.observaciones || '',
    detalles: venta.venta_detalle || [],
  }));

  setVentasDb(ventasMapeadas);

  resetForm();
} catch (error) {
  console.error(error);
  toast.error(
    editingId
      ? 'No se pudo actualizar la venta'
      : 'No se pudo registrar la venta'
  );
}
};

 const handleEdit = (id: string) => {
  const venta = ventasDb.find((v) => v.id === id);

  if (!venta) return;

  if (isCajaCerrada(venta.fecha)) {
    toast.error('No se puede editar, la caja está cerrada');
    return;
  }

  setEditingId(id);

  setFormData({
    fecha: new Date(venta.fecha + 'T12:00:00'),
    fechaPago: new Date(
      (venta.fechaPago || venta.fecha) + 'T12:00:00'
    ),
    clienteId: venta.clienteId,
    productoId: '',
    promocionId: '',
    precio: 0,
    cantidad: 1,
    formaPago: venta.formaPago,
    estadoPago: venta.estadoPago,
    entregamos: venta.entregamos,
    llevamos: venta.llevamos,
    observaciones: venta.observaciones || '',
  });

  const itemsEditados: ItemVenta[] = (venta.detalles || []).map(
    (detalle: any) => {
      const producto = productos.find(
        (p) => p.id === detalle.producto_id
      );

      const promo = detalle.promocion_id
        ? promociones.find(
            (p) => p.id === detalle.promocion_id
          )
        : undefined;

      return {
        id: detalle.id,
        tipo: detalle.promocion_id
          ? 'promocion'
          : 'producto',
        productoId: detalle.producto_id,
        promocionId: detalle.promocion_id || undefined,
        nombre:
          promo?.descripcion ||
          promo?.nombre ||
          producto?.nombre ||
          'Producto',
        cantidad: Number(detalle.cantidad || 1),
        precioUnitario: Number(
          detalle.precio_unitario || 0
        ),
        subtotal: Number(detalle.subtotal || 0),
      };
    }
  );

  setItemsVenta(itemsEditados);

  setIsOpen(true);
};

const handleDelete = async (id: string) => {
  const venta = ventasDb.find((v) => v.id === id);

  if (!venta) return;

  if (isCajaCerrada(venta.fecha)) {
    toast.error('No se puede eliminar, la caja está cerrada');
    return;
  }

  if (!confirm('¿Estás seguro de eliminar esta venta?')) {
    return;
  }

  try {
    await eliminarVentaCompleta(id);

    setVentasDb((actuales) =>
      actuales.filter((v) => v.id !== id)
    );

    toast.success('Venta eliminada');
  } catch (error) {
    console.error(error);
    toast.error('No se pudo eliminar la venta');
  }
};

const resetForm = () => {
  setFormData({ ...emptyForm });
  setItemsVenta([]);
  setEditingId(null);
  setIsOpen(false);
};

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const getProductoNombre = (id: string) => productos.find((p) => p.id === id)?.nombre || '';
  const getPromocionNombre = (id?: string) => promociones.find((p) => p.id === id)?.nombre || '';

  const formaPagoLabel: Record<FormaPago, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    pendiente: 'Pendiente',
    cuenta_corriente: 'Cuenta Corriente',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Ventas</h1>
          <p className="text-sm text-muted-foreground">
            {ventasDb.filter(v => v.fecha === hoy).length} ventas hoy
            {cajaCerrada && <span className="ml-2 text-warning">• Caja cerrada</span>}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
              <Plus className="w-5 h-5 mr-2" />
              Nueva Venta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Venta' : 'Nueva Venta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <DatePickerField
                date={formData.fecha}
                onDateChange={(d) => setFormData({ ...formData, fecha: d })}
              />

              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Popover open={clienteOpen} onOpenChange={setClienteOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clienteOpen}
                      className="w-full h-12 text-base justify-between font-normal"
                    >
                      {formData.clienteId
                        ? (() => {
                            const c = clientes.find((c) => c.id === formData.clienteId);
                            return c ? `${c.nombre} ${c.apellido}` : 'Seleccionar cliente';
                          })()
                        : 'Seleccionar cliente'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." />
                      <CommandList>
                        <CommandEmpty>No se encontró cliente.</CommandEmpty>
                        <CommandGroup>
                          {clientes
                            .filter((c) => c.nombre || c.apellido)
                            .map((c) => (
                              <CommandItem
                                key={c.id}
                                value={`${c.nombre} ${c.apellido}`}
                                onSelect={() => {
                                  setFormData({ ...formData, clienteId: c.id });
                                  setClienteOpen(false);
                                }}
                                className="text-base py-3"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.clienteId === c.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {c.nombre} {c.apellido}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

             <div className="space-y-4">
  <div className="space-y-2">
    <Label>Producto *</Label>

    <Select
  value={
    formData.promocionId
      ? `promo:${formData.promocionId}`
      : formData.productoId
        ? `producto:${formData.productoId}`
        : undefined
  }
  onValueChange={(v) => {
    if (v.startsWith('producto:')) {
      const productoId = v.replace('producto:', '');
      const producto = productos.find((p) => p.id === productoId);

      if (!producto) return;

      setFormData((actual) => ({
        ...actual,
        productoId: producto.id,
        promocionId: '',
        precio: producto.precioDefault * actual.cantidad,
      }));

      return;
    }

    if (v.startsWith('promo:')) {
      const promocionId = v.replace('promo:', '');
      const detalle = detallesPromociones[promocionId]?.[0];

      if (!detalle) {
        toast.error('La promoción no tiene precio configurado');
        return;
      }

      setFormData((actual) => ({
        ...actual,
        productoId: detalle.productoId,
        promocionId,
        precio: detalle.precioPromocional * actual.cantidad,
      }));
    }
  }}
>
  <SelectTrigger className="h-12 text-base">
    <SelectValue placeholder="Seleccionar producto" />
  </SelectTrigger>

  <SelectContent>
    {productos.map((p) => (
      <SelectItem
        key={`producto-${p.id}`}
        value={`producto:${p.id}`}
        className="text-base py-3"
      >
        {p.nombre} — {formatCurrency(p.precioDefault)}
      </SelectItem>
    ))}

    {promociones.map((promo) => {
      const detalle = detallesPromociones[promo.id]?.[0];

      if (!detalle) return null;

      return (
        <SelectItem
          key={`promo-${promo.id}`}
          value={`promo:${promo.id}`}
          className="text-base py-3"
        >
          {promo.descripcion || promo.nombre}
        </SelectItem>
      );
    })}
  </SelectContent>
</Select>
<Button
  type="button"
  onClick={agregarItemVenta}
  className="w-full h-12 text-base font-semibold"
>
  + Agregar
</Button>
  </div>

  <div className="space-y-2">
    <Label>Cantidad</Label>

    <Input
      type="number"
      min={1}
      value={formData.cantidad}
      onChange={(e) => {
        const cantidad = Math.max(
          1,
          parseInt(e.target.value) || 1
        );

        if (formData.promocionId) {
          const detalle =
            detallesPromociones[formData.promocionId]?.[0];

          setFormData({
            ...formData,
            cantidad,
            precio:
              (detalle?.precioPromocional ?? 0) * cantidad,
          });

          return;
        }

        const producto = productos.find(
          (p) => p.id === formData.productoId
        );

        setFormData({
          ...formData,
          cantidad,
          precio:
            (producto?.precioDefault ?? 0) * cantidad,
        });
      }}
      className="h-12 text-base"
    />
  </div>

  <div className="space-y-2">
    <Label>Precio *</Label>

    <Input
      type="number"
      value={formData.precio}
      readOnly
      className="h-12 text-base font-semibold bg-muted"
    />
  </div>
</div>
                  <DatePickerField
                date={formData.fechaPago}
                onDateChange={(d) => setFormData({ ...formData, fechaPago: d })}
                label="Fecha de Pago"
              />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Forma de Pago</Label>
                  <Select value={formData.formaPago} onValueChange={(v: FormaPago) => setFormData({ ...formData, formaPago: v })}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo" className="text-base py-3">Efectivo</SelectItem>
                      <SelectItem value="transferencia" className="text-base py-3">Transferencia</SelectItem>
                      <SelectItem value="pendiente" className="text-base py-3">Pendiente</SelectItem>
                      <SelectItem value="cuenta_corriente" className="text-base py-3">Cuenta Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado de Pago</Label>
                  <Select value={formData.estadoPago} onValueChange={(v: EstadoPago) => setFormData({ ...formData, estadoPago: v })}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagado" className="text-base py-3">Pagado</SelectItem>
                      <SelectItem value="pendiente" className="text-base py-3">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="entregamos">Entregamos (bidones)</Label>
                  <Input
                    id="entregamos"
                    type="number"
                    min={0}
                    value={formData.entregamos}
                    onChange={(e) => setFormData({ ...formData, entregamos: parseInt(e.target.value) || 0 })}
                    className="h-12 text-base"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="llevamos">Llevamos (vacíos)</Label>
                  <Input
                    id="llevamos"
                    type="number"
                    min={0}
                    value={formData.llevamos}
                    onChange={(e) => setFormData({ ...formData, llevamos: parseInt(e.target.value) || 0 })}
                    className="h-12 text-base"
                    placeholder="0"
                  />
                </div>
              </div>

             <div className="space-y-3">
  <Label className="text-base font-semibold">Detalle de venta</Label>

  {itemsVenta.length === 0 ? (
    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
      Todavía no agregaste productos
    </div>
  ) : (
    <>
      {itemsVenta.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-base">
                {item.nombre}
              </p>

              <p className="text-sm text-muted-foreground">
                {formatCurrency(item.precioUnitario)} x {item.cantidad}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() =>
                setItemsVenta((actuales) =>
                  actuales.filter((i) => i.id !== item.id)
                )
              }
              className="text-destructive"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11"
                disabled={item.cantidad <= 1}
                onClick={() =>
                  setItemsVenta((actuales) =>
                    actuales.map((i) =>
                      i.id === item.id
                        ? {
                            ...i,
                            cantidad: i.cantidad - 1,
                            subtotal:
                              i.precioUnitario * (i.cantidad - 1),
                          }
                        : i
                    )
                  )
                }
              >
                -
              </Button>

              <span className="w-8 text-center text-lg font-semibold">
                {item.cantidad}
              </span>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-11 w-11"
                onClick={() =>
                  setItemsVenta((actuales) =>
                    actuales.map((i) =>
                      i.id === item.id
                        ? {
                            ...i,
                            cantidad: i.cantidad + 1,
                            subtotal:
                              i.precioUnitario * (i.cantidad + 1),
                          }
                        : i
                    )
                  )
                }
              >
                +
              </Button>
            </div>

            <span className="text-lg font-bold">
              {formatCurrency(item.subtotal)}
            </span>
          </div>
        </div>
      ))}

      <div className="rounded-xl border bg-muted/30 p-4 flex items-center justify-between">
        <span className="text-lg font-bold">
          Total
        </span>

        <span className="text-2xl font-bold text-primary">
          {formatCurrency(totalVenta)}
        </span>
      </div>
    </>
  )}
</div>

<div className="space-y-2">
  <Label>Observación</Label>

  <Input
    value={formData.observaciones}
    maxLength={50}
    onChange={(e) =>
      setFormData({
        ...formData,
        observaciones: e.target.value,
      })
    }
    placeholder="Observación opcional"
    className="h-12 text-base"
  />

  <p className="text-xs text-muted-foreground text-right">
    {formData.observaciones.length}/50
  </p>
</div>
              
    

              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" className="w-full h-12 text-base">
                  {editingId ? 'Guardar Cambios' : 'Registrar Venta'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full h-12 text-base">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Cards List */}
      {filteredVentas.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No hay ventas registradas</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVentas.map((venta) => {
            const cliente = clientes.find((c) => c.id === venta.clienteId);
            const cerrada = isCajaCerrada(venta.fecha);
            return (
              <MobileCard key={venta.id}>
                <MobileCardHeader
                  title={`${cliente?.nombre} ${cliente?.apellido}`}
                  subtitle={new Date(venta.fecha + 'T12:00:00').toLocaleDateString('es-AR')}
                  badge={
                    <span className={`status-badge ${venta.estadoPago === 'pagado' ? 'status-completed' : 'status-pending'}`}>
                      {venta.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </span>
                  }
                  actions={
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(venta.id)}
                        className="h-10 w-10 text-muted-foreground hover:text-foreground"
                        disabled={cerrada}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(venta.id)}
                        className="h-10 w-10 text-destructive hover:text-destructive"
                        disabled={cerrada}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  }
                />
                
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="space-y-1">
  {(venta.detalles || []).map((detalle: any) => {
    const producto = productos.find(
      (p) => p.id === detalle.producto_id
    );

    const promo = detalle.promocion_id
      ? promociones.find(
          (p) => p.id === detalle.promocion_id
        )
      : undefined;

    return (
      <div
        key={detalle.id}
        className="flex justify-between gap-3 text-sm"
      >
        <span>
          {promo?.descripcion ||
            promo?.nombre ||
            producto?.nombre ||
            'Producto'}{' '}
          x{detalle.cantidad}
        </span>

        <span className="font-medium">
          {formatCurrency(Number(detalle.subtotal || 0))}
        </span>
      </div>
    );
  })}
</div>
                  <MobileCardRow 
                    label="Total" 
                    value={<span className="text-lg font-bold text-primary">{formatCurrency(venta.precio)}</span>}
                  />
                  <div className="flex items-center gap-4 text-sm pt-1">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-muted-foreground" />
                      <span>{formaPagoLabel[venta.formaPago]}</span>
                    </div>
                    {(venta.entregamos > 0 || venta.llevamos > 0) && (
                      <div className="flex items-center gap-3 text-xs">
                        {venta.entregamos > 0 && (
                          <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            ↓ {venta.entregamos} entreg.
                          </span>
                        )}
                        {venta.llevamos > 0 && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            ↑ {venta.llevamos} llev.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {venta.observaciones && (
                    <p className="text-sm text-muted-foreground italic pt-1">
                      "{venta.observaciones}"
                    </p>
                  )}
                </div>
              </MobileCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
