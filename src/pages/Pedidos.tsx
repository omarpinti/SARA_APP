import { useState } from 'react';
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
import { Plus, Search, ClipboardList, ShoppingCart, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { PedidoDetalle, EstadoPedido } from '@/types';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card';

export default function Pedidos() {
  const { clientes, pedidos, productos, addPedido, updatePedido, deletePedido, convertirPedidoAVenta } = useStore();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    clienteId: '',
    observaciones: '',
    detalles: [] as { productoId: string; cantidad: number }[],
  });

  const [convertData, setConvertData] = useState({
    precio: 0,
    formaPago: 'efectivo' as 'efectivo' | 'transferencia' | 'pendiente' | 'cuenta_corriente',
    estadoPago: 'pagado' as 'pagado' | 'pendiente',
    entregamos: 0,
    llevamos: 0,
  });

  const filteredPedidos = pedidos.filter((p) => {
    const cliente = clientes.find((c) => c.id === p.clienteId);
    return (
      cliente?.nombre.toLowerCase().includes(search.toLowerCase()) ||
      cliente?.apellido.toLowerCase().includes(search.toLowerCase())
    );
  });

  const addDetalle = () => {
    if (productos.length === 0) {
      toast.error('Todavía no hay productos cargados');
      return;
    }
    setFormData({
      ...formData,
      detalles: [...formData.detalles, { productoId: productos[0].id, cantidad: 1 }],
    });
  };

  const removeDetalle = (index: number) => {
    setFormData({
      ...formData,
      detalles: formData.detalles.filter((_, i) => i !== index),
    });
  };

  const updateDetalle = (index: number, field: 'productoId' | 'cantidad', value: string | number) => {
    const newDetalles = [...formData.detalles];
    newDetalles[index] = { ...newDetalles[index], [field]: value };
    setFormData({ ...formData, detalles: newDetalles });
  };

  const TIPO_LABELS: Record<string, string> = {
    bidon_6: '6 Litros',
    bidon_10: '10 Litros',
    bidon_20: '20 Litros',
    pack: 'Pack',
  };

  const FORMATO_LABELS: Record<string, string> = {
    pico: 'Pico / Canilla',
    dispenser: 'Dispenser',
  };

  const tamanosDisponibles = Array.from(new Set(productos.map((p) => p.tipo)));
  const formatosDisponibles = Array.from(
    new Set(productos.map((p) => p.formato).filter(Boolean))
  ) as string[];

  const getProducto = (id: string) => productos.find((p) => p.id === id);

  const updateDetalleDimension = (index: number, dimension: 'tipo' | 'formato', value: string) => {
    const actual = getProducto(formData.detalles[index]?.productoId);
    const tipo = dimension === 'tipo' ? value : actual?.tipo;
    const formato = dimension === 'formato' ? value : actual?.formato;

    const match = productos.find((p) => p.tipo === tipo && p.formato === formato);
    if (match) {
      updateDetalle(index, 'productoId', match.id);
    } else {
      toast.error('Esa combinación de tamaño y formato no existe');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.clienteId) {
      toast.error('Selecciona un cliente');
      return;
    }

    if (formData.detalles.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    const detallesConId: PedidoDetalle[] = formData.detalles.map((d, i) => ({
      id: `det_new_${i}`,
      pedidoId: '',
      productoId: d.productoId,
      cantidad: d.cantidad,
    }));

    addPedido({
      fecha: new Date().toISOString().split('T')[0],
      clienteId: formData.clienteId,
      estado: 'pendiente',
      observaciones: formData.observaciones,
      detalles: detallesConId,
    });

    toast.success('Pedido creado');
    resetForm();
  };

  const handleConvert = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPedidoId) return;

    const pedido = pedidos.find((p) => p.id === selectedPedidoId);
    if (!pedido) return;

    convertirPedidoAVenta(selectedPedidoId, {
      fecha: new Date().toISOString().split('T')[0],
      clienteId: pedido.clienteId,
      productoId: pedido.detalles[0]?.productoId || '',
      precio: convertData.precio,
      formaPago: convertData.formaPago,
      estadoPago: convertData.estadoPago,
      entregamos: convertData.entregamos,
      llevamos: convertData.llevamos,
      observaciones: pedido.observaciones,
    });

    toast.success('Pedido convertido a venta');
    setIsConvertOpen(false);
    setSelectedPedidoId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este pedido?')) {
      deletePedido(id);
      toast.success('Pedido eliminado');
    }
  };

  const handleStatusChange = (id: string, estado: EstadoPedido) => {
    updatePedido(id, { estado });
    toast.success('Estado actualizado');
  };

  const resetForm = () => {
    setFormData({ clienteId: '', observaciones: '', detalles: [] });
    setIsOpen(false);
  };

  const getProductoNombre = (id: string) => productos.find((p) => p.id === id)?.nombre || '';

  const getStatusClass = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'status-pending';
      case 'subido': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'entregado': return 'status-completed';
      case 'cancelado': return 'status-cancelled';
      default: return '';
    }
  };

  const getStatusLabel = (estado: string) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Pedidos</h1>
          <p className="text-sm text-muted-foreground">{pedidos.filter(p => p.estado === 'pendiente').length} pendientes</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Pedido</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={formData.clienteId} onValueChange={(v) => setFormData({ ...formData, clienteId: v })}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-base py-3">
                        {c.nombre} {c.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Productos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDetalle} className="h-10">
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
                {formData.detalles.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6 bg-muted/50 rounded-lg">
                    Agrega productos al pedido
                  </p>
                )}
                <div className="space-y-3">
                  {formData.detalles.map((det, i) => {
                    const productoActual = getProducto(det.productoId);
                    return (
                      <div key={i} className="flex flex-col gap-2 p-3 bg-muted/30 rounded-lg">
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={productoActual?.tipo || ''}
                            onValueChange={(v) => updateDetalleDimension(i, 'tipo', v)}
                          >
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Tamaño" />
                            </SelectTrigger>
                            <SelectContent>
                              {tamanosDisponibles.map((tipo) => (
                                <SelectItem key={tipo} value={tipo} className="text-base py-3">
                                  {TIPO_LABELS[tipo] || tipo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={productoActual?.formato || ''}
                            onValueChange={(v) => updateDetalleDimension(i, 'formato', v)}
                          >
                            <SelectTrigger className="h-12 text-base">
                              <SelectValue placeholder="Formato" />
                            </SelectTrigger>
                            <SelectContent>
                              {formatosDisponibles.map((formato) => (
                                <SelectItem key={formato} value={formato} className="text-base py-3">
                                  {FORMATO_LABELS[formato] || formato}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={det.cantidad}
                            onChange={(e) => updateDetalle(i, 'cantidad', parseInt(e.target.value) || 1)}
                            className="h-12 text-base flex-1"
                            placeholder="Cantidad"
                          />
                          <Button type="button" variant="destructive" size="icon" onClick={() => removeDetalle(i)} className="h-12 w-12 shrink-0">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
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
                <Button type="submit" className="w-full h-12 text-base">Crear Pedido</Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full h-12 text-base">
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Convert to Sale Dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>Convertir a Venta</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConvert} className="space-y-4">
            <div className="space-y-2">
              <Label>Precio Total *</Label>
              <Input
                type="number"
                min={0}
                value={convertData.precio}
                onChange={(e) => setConvertData({ ...convertData, precio: parseFloat(e.target.value) || 0 })}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Forma de Pago</Label>
                <Select value={convertData.formaPago} onValueChange={(v: typeof convertData.formaPago) => setConvertData({ ...convertData, formaPago: v })}>
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
                <Select value={convertData.estadoPago} onValueChange={(v: typeof convertData.estadoPago) => setConvertData({ ...convertData, estadoPago: v })}>
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
                <Label htmlFor="convert-entregamos">Entregamos (bidones)</Label>
                <Input
                  id="convert-entregamos"
                  type="number"
                  min={0}
                  value={convertData.entregamos}
                  onChange={(e) => setConvertData({ ...convertData, entregamos: parseInt(e.target.value) || 0 })}
                  className="h-12 text-base"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="convert-llevamos">Llevamos (vacíos)</Label>
                <Input
                  id="convert-llevamos"
                  type="number"
                  min={0}
                  value={convertData.llevamos}
                  onChange={(e) => setConvertData({ ...convertData, llevamos: parseInt(e.target.value) || 0 })}
                  className="h-12 text-base"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" className="w-full h-12 text-base">Convertir a Venta</Button>
              <Button type="button" variant="outline" onClick={() => setIsConvertOpen(false)} className="w-full h-12 text-base">
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
      {filteredPedidos.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No hay pedidos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPedidos.map((pedido) => {
            const cliente = clientes.find((c) => c.id === pedido.clienteId);
            return (
              <MobileCard key={pedido.id}>
                <MobileCardHeader
                  title={`${cliente?.nombre} ${cliente?.apellido}`}
                  subtitle={new Date(pedido.fecha).toLocaleDateString('es-AR')}
                  badge={
                    <span className={`status-badge ${getStatusClass(pedido.estado)}`}>
                      {getStatusLabel(pedido.estado)}
                    </span>
                  }
                  actions={
                    <>
                      {pedido.estado === 'pendiente' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPedidoId(pedido.id);
                            setIsConvertOpen(true);
                          }}
                          className="h-10 w-10 text-success hover:text-success"
                          title="Convertir a venta"
                        >
                          <ShoppingCart className="w-5 h-5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(pedido.id)}
                        className="h-10 w-10 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </>
                  }
                />
                
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm">
                      {pedido.detalles.map((d, i) => (
                        <span key={i}>
                          {d.cantidad}x {getProductoNombre(d.productoId)}
                          {i < pedido.detalles.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {pedido.observaciones && (
                    <p className="text-sm text-muted-foreground italic">
                      "{pedido.observaciones}"
                    </p>
                  )}
                  
                  <div className="pt-2">
                    <Select value={pedido.estado} onValueChange={(v: EstadoPedido) => handleStatusChange(pedido.id, v)}>
                      <SelectTrigger className="h-10 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendiente" className="py-3">Pendiente</SelectItem>
                        <SelectItem value="subido" className="py-3">Subido</SelectItem>
                        <SelectItem value="entregado" className="py-3">Entregado</SelectItem>
                        <SelectItem value="cancelado" className="py-3">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </MobileCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
