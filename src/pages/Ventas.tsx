import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { productos, promociones } from '@/data/mockData';
import { FormaPago, EstadoPago } from '@/types';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card';
import { DatePickerField } from '@/components/DatePickerField';

const emptyForm = {
  fecha: new Date(),
  fechaPago: new Date(),
  clienteId: '',
  productoId: productos[0].id,
  promocionId: '',
  precio: 0,
  formaPago: 'efectivo' as FormaPago,
  estadoPago: 'pagado' as EstadoPago,
  entregamos: 0,
  llevamos: 0,
  observaciones: '',
};

export default function Ventas() {
  const { clientes, ventas, addVenta, updateVenta, deleteVenta, isCajaCerrada } = useStore();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [clienteOpen, setClienteOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const hoy = new Date().toISOString().split('T')[0];
  const cajaCerrada = isCajaCerrada(hoy);

  const [formData, setFormData] = useState({ ...emptyForm });

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

  const filteredVentas = ventas
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const y = formData.fecha.getFullYear();
    const m = String(formData.fecha.getMonth() + 1).padStart(2, '0');
    const d = String(formData.fecha.getDate()).padStart(2, '0');
    const fechaStr = `${y}-${m}-${d}`;

    if (isCajaCerrada(fechaStr)) {
      toast.error('La caja de ese día está cerrada');
      return;
    }

    if (!formData.clienteId) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (formData.precio <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    const fechaPago = formData.fechaPago;
    const fpY = fechaPago.getFullYear();
    const fpM = String(fechaPago.getMonth() + 1).padStart(2, '0');
    const fpD = String(fechaPago.getDate()).padStart(2, '0');
    const fechaPagoStr = `${fpY}-${fpM}-${fpD}`;

    const ventaPayload = {
      fecha: fechaStr,
      clienteId: formData.clienteId,
      productoId: formData.productoId,
      promocionId: formData.promocionId || undefined,
      precio: formData.precio,
      formaPago: formData.formaPago,
      estadoPago: formData.estadoPago,
      fechaPago: formData.estadoPago === 'pagado' ? fechaPagoStr : undefined,
      entregamos: formData.entregamos,
      llevamos: formData.llevamos,
      observaciones: formData.observaciones,
    };

    if (editingId) {
      updateVenta(editingId, ventaPayload);
      toast.success('Venta actualizada');
    } else {
      addVenta(ventaPayload);
      toast.success('Venta registrada');
    }
    resetForm();
  };

  const handleEdit = (id: string) => {
    const venta = ventas.find(v => v.id === id);
    if (!venta) return;
    if (isCajaCerrada(venta.fecha)) {
      toast.error('No se puede editar, la caja está cerrada');
      return;
    }
    setEditingId(id);
    setFormData({
      fecha: new Date(venta.fecha + 'T12:00:00'),
      fechaPago: new Date((venta.fechaPago || venta.fecha) + 'T12:00:00'),
      clienteId: venta.clienteId,
      productoId: venta.productoId,
      promocionId: venta.promocionId || '',
      precio: venta.precio,
      formaPago: venta.formaPago,
      estadoPago: venta.estadoPago,
      entregamos: venta.entregamos,
      llevamos: venta.llevamos,
      observaciones: venta.observaciones,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    const venta = ventas.find(v => v.id === id);
    if (venta && isCajaCerrada(venta.fecha)) {
      toast.error('No se puede eliminar, la caja está cerrada');
      return;
    }
    if (confirm('¿Estás seguro de eliminar esta venta?')) {
      deleteVenta(id);
      toast.success('Venta eliminada');
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
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
            {ventas.filter(v => v.fecha === hoy).length} ventas hoy
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
                  <Select value={formData.productoId} onValueChange={(v) => setFormData({ ...formData, productoId: v })}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-base py-3">{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Promoción</Label>
                  <Select value={formData.promocionId || "none"} onValueChange={(v) => setFormData({ ...formData, promocionId: v === "none" ? "" : v })}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Sin promoción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-base py-3">Sin promoción</SelectItem>
                      {promociones.map((p) => (
                        <SelectItem key={p.id} value={p.id} className="text-base py-3">{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Precio *</Label>
                <Input
                  type="number"
                  min={0}
                  step={100}
                  value={formData.precio}
                  onChange={(e) => setFormData({ ...formData, precio: parseFloat(e.target.value) || 0 })}
                  className="h-12 text-base"
                />
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

              <div className="space-y-2">
                <Label>Observaciones</Label>
                <Textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  placeholder="Notas adicionales..."
                  className="min-h-[100px] text-base"
                />
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
                  <MobileCardRow 
                    label="Producto" 
                    value={getProductoNombre(venta.productoId)} 
                  />
                  {venta.promocionId && (
                    <MobileCardRow 
                      label="Promoción" 
                      value={getPromocionNombre(venta.promocionId)} 
                    />
                  )}
                  <MobileCardRow 
                    label="Precio" 
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
