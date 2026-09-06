import { useEffect, useState } from 'react';
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
import { Plus, Search, Receipt, Trash2, CreditCard, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card';
import { DatePickerField } from '@/components/DatePickerField';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGastos, registrarGasto } from '@/lib/api/gastos';

const emptyForm = {
  fecha: new Date(),
  detalle: '',
  monto: 0,
  formaPago: 'efectivo' as 'efectivo' | 'transferencia',
  observaciones: '',
};

export default function Gastos() {
  const { negocioId } = useAuth();
  const [gastosDb, setGastosDb] = useState<any[]>([]);
  const { gastos, addGasto, updateGasto, deleteGasto, isCajaCerrada } = useStore();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const hoy = new Date().toISOString().split('T')[0];
  const cajaCerrada = isCajaCerrada(hoy);

  const [formData, setFormData] = useState({ ...emptyForm });
  useEffect(() => {
  if (!negocioId) return;

  fetchGastos(negocioId)
    .then(setGastosDb)
    .catch(console.error);
}, [negocioId]);

  const filteredGastos = gastosDb
    .filter((g) =>
      g.detalle.toLowerCase().includes(search.toLowerCase())
    )
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

  if (!formData.detalle) {
    toast.error('El detalle es requerido');
    return;
  }

  if (formData.monto <= 0) {
    toast.error('El monto debe ser mayor a 0');
    return;
  }

  try {
    await registrarGasto({
      negocioId,
      fecha: fechaStr,
      fechaPago: fechaStr,
      detalle: formData.detalle,
      monto: formData.monto,
      formaPago: formData.formaPago,
      estadoPago: 'pagado',
      observaciones: formData.observaciones,
    });

    const data = await fetchGastos(negocioId);

    setGastosDb(
      data.map((g: any) => ({
        id: g.id,
        fecha: g.fecha,
        fechaPago: g.fecha_pago,
        detalle: g.detalle,
        monto: Number(g.monto),
        formaPago: g.forma_pago,
        estadoPago: g.estado_pago,
        observaciones: g.observaciones || '',
      }))
    );

    toast.success('Gasto registrado');
    resetForm();
  } catch (error) {
    console.error(error);
    toast.error('No se pudo registrar el gasto');
  }
};
  const handleEdit = (id: string) => {
    const gasto = gastos.find(g => g.id === id);
    if (!gasto) return;
    if (isCajaCerrada(gasto.fecha)) {
      toast.error('No se puede editar, la caja está cerrada');
      return;
    }
    setEditingId(id);
    setFormData({
      fecha: new Date(gasto.fecha + 'T12:00:00'),
      detalle: gasto.detalle,
      monto: gasto.monto,
      formaPago: gasto.formaPago,
      observaciones: gasto.observaciones,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    const gasto = gastos.find(g => g.id === id);
    if (gasto && isCajaCerrada(gasto.fecha)) {
      toast.error('No se puede eliminar, la caja está cerrada');
      return;
    }
    if (confirm('¿Estás seguro de eliminar este gasto?')) {
      deleteGasto(id);
      toast.success('Gasto eliminado');
    }
  };

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setIsOpen(false);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            {gastos.filter(g => g.fecha === hoy).length} gastos hoy
            {cajaCerrada && <span className="ml-2 text-warning">• Caja cerrada</span>}
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Gasto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Gasto' : 'Nuevo Gasto'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <DatePickerField
                date={formData.fecha}
                onDateChange={(d) => setFormData({ ...formData, fecha: d })}
              />

              <div className="space-y-2">
                <Label>Detalle *</Label>
                <Input
                  value={formData.detalle}
                  onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
                  placeholder="Ej: Combustible, Mantenimiento..."
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: parseFloat(e.target.value) || 0 })}
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forma de Pago</Label>
                  <Select value={formData.formaPago} onValueChange={(v: 'efectivo' | 'transferencia') => setFormData({ ...formData, formaPago: v })}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="efectivo" className="text-base py-3">Efectivo</SelectItem>
                      <SelectItem value="transferencia" className="text-base py-3">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {editingId ? 'Guardar Cambios' : 'Registrar Gasto'}
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
          placeholder="Buscar por detalle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Cards List */}
      {filteredGastos.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No hay gastos registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGastos.map((gasto) => {
            const cerrada = isCajaCerrada(gasto.fecha);
            return (
              <MobileCard key={gasto.id}>
                <MobileCardHeader
                  title={gasto.detalle}
                  subtitle={new Date(gasto.fecha + 'T12:00:00').toLocaleDateString('es-AR')}
                  actions={
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(gasto.id)}
                        className="h-10 w-10 text-muted-foreground hover:text-foreground"
                        disabled={cerrada}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(gasto.id)}
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
                    label="Monto" 
                    value={<span className="text-lg font-bold text-destructive">{formatCurrency(gasto.monto)}</span>}
                  />
                  <div className="flex items-center gap-2 text-sm">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span>{gasto.formaPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}</span>
                  </div>
                  {gasto.observaciones && (
                    <p className="text-sm text-muted-foreground italic pt-1">
                      "{gasto.observaciones}"
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
