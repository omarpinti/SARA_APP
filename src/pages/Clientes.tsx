import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, Users, Phone, MapPin, Calendar, User, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { MobileCard, MobileCardHeader, MobileCardRow } from '@/components/ui/mobile-card';
import { ClienteProfile } from '@/components/ClienteProfile';
import type { Cliente } from '@/types';

export default function Clientes() {
  const navigate = useNavigate();
  const { clientes, addCliente, updateCliente, deleteCliente } = useStore();
  const [search, setSearch] = useState('');
  const [perfilCliente, setPerfilCliente] = useState<Cliente | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    direccion: '',
  });

  const filteredClientes = clientes.filter(
    (c) =>
      (c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.apellido || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.telefono || '').includes(search)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.apellido) {
      toast.error('Nombre y apellido son requeridos');
      return;
    }

    if (editingId) {
      updateCliente(editingId, formData);
      toast.success('Cliente actualizado');
    } else {
      const nuevoCliente = await addCliente({
        ...formData,
        fechaAlta: new Date().toISOString().split('T')[0],
      });
      toast.success('Cliente creado', {
        action: {
          label: 'Ir a vender',
          onClick: () => navigate('/ventas', { state: { clienteId: nuevoCliente.id } }),
        },
      });
    }

    resetForm();
  };

  const handleEdit = (cliente: typeof clientes[0]) => {
    setEditingId(cliente.id);
    setFormData({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      deleteCliente(id);
      toast.success('Cliente eliminado');
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', apellido: '', telefono: '', direccion: '' });
    setEditingId(null);
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} clientes registrados</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
              <Plus className="w-5 h-5 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-lg mx-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre"
                    className="h-12 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apellido">Apellido *</Label>
                  <Input
                    id="apellido"
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    placeholder="Apellido"
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="11-1234-5678"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  placeholder="Calle y número"
                  className="h-12 text-base"
                />
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button type="submit" className="w-full h-12 text-base">
                  {editingId ? 'Guardar Cambios' : 'Crear Cliente'}
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
          placeholder="Buscar por nombre, apellido o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Cards List */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-muted-foreground">No hay clientes registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClientes.map((cliente) => (
            <MobileCard key={cliente.id}>
              <MobileCardHeader
                title={`${cliente.nombre} ${cliente.apellido}`}
                subtitle={`#${cliente.numero}`}
                actions={
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(cliente)}
                      className="h-10 w-10"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(cliente.id)}
                      className="h-10 w-10 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </>
                }
              />
              <div className="space-y-2 pt-2 border-t border-border">
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
                    <span className="truncate">{cliente.direccion}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Alta: {new Date(cliente.fechaAlta).toLocaleDateString('es-AR')}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPerfilCliente(cliente)}
                  className="w-full h-11 text-base mt-1"
                >
                  <User className="w-5 h-5 mr-2" />
                  Ver Perfil
                </Button>
                <Button
                  onClick={() => navigate('/ventas', { state: { clienteId: cliente.id } })}
                  className="w-full h-11 text-base"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Nueva Venta
                </Button>
              </div>
            </MobileCard>
          ))}
        </div>
      )}

      <ClienteProfile
        cliente={perfilCliente}
        open={!!perfilCliente}
        onOpenChange={(open) => { if (!open) setPerfilCliente(null); }}
      />
    </div>
  );
}
