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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Receipt,
  Trash2,
  CreditCard,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  MobileCard,
  MobileCardHeader,
  MobileCardRow,
} from '@/components/ui/mobile-card';
import { DatePickerField } from '@/components/DatePickerField';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchGastos,
  registrarGasto,
  actualizarGasto,
  eliminarGasto,
} from '@/lib/api/gastos';

type FormaPago = 'efectivo' | 'transferencia';

type GastoDB = {
  id: string;
  negocio_id: string;
  fecha: string;
  fecha_pago: string | null;
  detalle: string;
  monto: number;
  forma_pago: FormaPago;
  estado_pago: 'pagado' | 'pendiente';
  observaciones: string | null;
  created_at?: string;
};

const emptyForm = {
  fecha: new Date(),
  detalle: '',
  monto: 0,
  formaPago: 'efectivo' as FormaPago,
  observaciones: '',
};

export default function Gastos() {
  const { negocioId } = useAuth();

  const { isCajaCerrada } = useStore();

  const [gastosDb, setGastosDb] = useState<GastoDB[]>([]);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    ...emptyForm,
  });

  const hoy = new Date().toISOString().split('T')[0];
  const cajaCerrada = isCajaCerrada(hoy);

  const cargarGastos = async () => {
    if (!negocioId) return;

    try {
      const data = await fetchGastos(negocioId);

      setGastosDb(
        data.map((g: any) => ({
          id: g.id,
          negocio_id: g.negocio_id,
          fecha: g.fecha,
          fecha_pago: g.fecha_pago,
          detalle: g.detalle,
          monto: Number(g.monto),
          forma_pago: g.forma_pago,
          estado_pago: g.estado_pago,
          observaciones: g.observaciones || null,
          created_at: g.created_at,
        }))
      );
    } catch (error) {
      console.error('Error cargando gastos:', error);
      toast.error('No se pudieron cargar los gastos');
    }
  };

  useEffect(() => {
    cargarGastos();
  }, [negocioId]);

  const filteredGastos = gastosDb
    .filter((gasto) =>
      gasto.detalle
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dateCompare = b.fecha.localeCompare(a.fecha);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return (b.created_at || '').localeCompare(
        a.created_at || ''
      );
    });

  const dateToString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');

    return `${y}-${m}-${d}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fechaStr = dateToString(formData.fecha);

    if (isCajaCerrada(fechaStr)) {
      toast.error('La caja de ese día está cerrada');
      return;
    }

    if (!negocioId) {
      toast.error('No se encontró el negocio');
      return;
    }

    if (!formData.detalle.trim()) {
      toast.error('El detalle es requerido');
      return;
    }

    if (formData.monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    setLoading(true);

    try {
      if (editingId) {
        await actualizarGasto({
          negocioId,
          gastoId: editingId,
          fecha: fechaStr,
          fechaPago: fechaStr,
          detalle: formData.detalle.trim(),
          monto: formData.monto,
          formaPago: formData.formaPago,
          estadoPago: 'pagado',
          observaciones: formData.observaciones.trim(),
        });

        toast.success('Gasto actualizado');
      } else {
        await registrarGasto({
          negocioId,
          fecha: fechaStr,
          fechaPago: fechaStr,
          detalle: formData.detalle.trim(),
          monto: formData.monto,
          formaPago: formData.formaPago,
          estadoPago: 'pagado',
          observaciones: formData.observaciones.trim(),
        });

        toast.success('Gasto registrado');
      }

      await cargarGastos();
      resetForm();
    } catch (error) {
      console.error('Error guardando gasto:', error);

      toast.error(
        editingId
          ? 'No se pudo actualizar el gasto'
          : 'No se pudo registrar el gasto'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    if (loading) return;

    const gasto = gastosDb.find(
      (g) => g.id === id
    );

    if (!gasto) {
      toast.error('No se encontró el gasto');
      return;
    }

    if (isCajaCerrada(gasto.fecha)) {
      toast.error(
        'No se puede editar, la caja está cerrada'
      );
      return;
    }

    setEditingId(gasto.id);

    setFormData({
      fecha: new Date(
        `${gasto.fecha}T12:00:00`
      ),
      detalle: gasto.detalle,
      monto: Number(gasto.monto),
      formaPago: gasto.forma_pago,
      observaciones: gasto.observaciones || '',
    });

    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (loading) return;

    const gasto = gastosDb.find(
      (g) => g.id === id
    );

    if (!gasto) {
      toast.error('No se encontró el gasto');
      return;
    }

    if (isCajaCerrada(gasto.fecha)) {
      toast.error(
        'No se puede eliminar, la caja está cerrada'
      );
      return;
    }

    const confirmado = confirm(
      '¿Estás seguro de eliminar este gasto?'
    );

    if (!confirmado) {
      return;
    }

    setLoading(true);

    try {
      await eliminarGasto(id);

      await cargarGastos();

      toast.success('Gasto eliminado');
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      toast.error('No se pudo eliminar el gasto');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      ...emptyForm,
      fecha: new Date(),
    });

    setEditingId(null);
    setIsOpen(false);
  };

  const openNewGasto = () => {
    if (loading) return;

    const fechaActual = new Date();
    const fechaStr = dateToString(fechaActual);

    if (isCajaCerrada(fechaStr)) {
      toast.error('La caja de hoy está cerrada');
      return;
    }

    setEditingId(null);

    setFormData({
      ...emptyForm,
      fecha: fechaActual,
    });

    setIsOpen(true);
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);

  const formatDate = (date: string) => {
    if (!date) return '';

    const [year, month, day] = date.split('-');

    return `${day}/${month}/${year}`;
  };

  const gastosHoy = gastosDb.filter(
    (gasto) => gasto.fecha === hoy
  ).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">
            Gastos
          </h1>

          <p className="text-sm text-muted-foreground">
            {gastosHoy} gastos hoy

            {cajaCerrada && (
              <span className="ml-2 text-warning">
                • Caja cerrada
              </span>
            )}
          </p>
        </div>

        <Button
          onClick={openNewGasto}
          className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm"
          disabled={loading}
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar gasto..."
          className="pl-9"
        />
      </div>

      <div className="space-y-3">
        {filteredGastos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
            <Receipt className="w-10 h-10 text-muted-foreground mb-3" />

            <p className="font-medium">
              No hay gastos
            </p>

            <p className="text-sm text-muted-foreground">
              {search
                ? 'No se encontraron gastos con esa búsqueda.'
                : 'Todavía no registraste ningún gasto.'}
            </p>
          </div>
        ) : (
          filteredGastos.map((gasto) => (
            <div
              key={gasto.id}
              className="border rounded-lg p-4 bg-card"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Receipt className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {gasto.detalle}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {formatDate(gasto.fecha)}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs inline-flex items-center gap-1 text-muted-foreground">
                        <CreditCard className="w-3 h-3" />

                        {gasto.forma_pago === 'efectivo'
                          ? 'Efectivo'
                          : 'Transferencia'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <p className="font-semibold whitespace-nowrap">
                    {formatCurrency(gasto.monto)}
                  </p>

                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleEdit(gasto.id)
                      }
                      disabled={loading}
                      title="Editar gasto"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleDelete(gasto.id)
                      }
                      disabled={loading}
                      title="Eliminar gasto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (!open && !loading) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId
                ? 'Editar Gasto'
                : 'Nuevo Gasto'}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <DatePickerField
              date={formData.fecha}
              onDateChange={(date) => {
                if (!date || loading) return;

                setFormData((prev) => ({
                  ...prev,
                  fecha: date,
                }));
              }}
            />

            <div className="space-y-2">
              <Label htmlFor="detalle">
                Detalle
              </Label>

              <Input
                id="detalle"
                value={formData.detalle}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    detalle: e.target.value,
                  }))
                }
                placeholder="Ej: Combustible"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="monto">
                Monto
              </Label>

              <Input
                id="monto"
                type="number"
                min="0"
                step="0.01"
                value={
                  formData.monto === 0
                    ? ''
                    : formData.monto
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    monto:
                      Number(e.target.value) || 0,
                  }))
                }
                placeholder="0"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Forma de pago
              </Label>

              <Select
                value={formData.formaPago}
                onValueChange={(value: FormaPago) =>
                  setFormData((prev) => ({
                    ...prev,
                    formaPago: value,
                  }))
                }
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar forma de pago" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="efectivo">
                    Efectivo
                  </SelectItem>

                  <SelectItem value="transferencia">
                    Transferencia
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">
                Observaciones
              </Label>

              <Textarea
                id="observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observaciones:
                      e.target.value,
                  }))
                }
                placeholder="Observaciones opcionales..."
                rows={3}
                disabled={loading}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={loading}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Guardando...'
                  : editingId
                    ? 'Guardar Cambios'
                    : 'Registrar Gasto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
