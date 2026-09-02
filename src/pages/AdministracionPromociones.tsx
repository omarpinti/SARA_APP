import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { fetchProductos } from '@/lib/api/productos';
import type { Producto } from '@/types';

import {
  fetchPromocionDetalles,
  createPromocionDetalle,
  type PromocionDetalleAdmin,
} from '@/lib/api/promocionDetalle';

import {
  fetchPromociones,
  createPromocion,
  updatePromocion,
  deletePromocion,
  type PromocionAdmin,
} from '@/lib/api/promociones';

export default function AdministracionPromociones() {
  const { negocioId } = useAuth();

  const [promociones, setPromociones] = useState<PromocionAdmin[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [detalles, setDetalles] = useState<PromocionDetalleAdmin[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadPromo, setCantidadPromo] = useState(1);
  const [precioPromo, setPrecioPromo] = useState(0);

  useEffect(() => {
    async function cargar() {
      if (!negocioId) {
        setLoading(false);
        return;
      }

      try {
        const promocionesData = await fetchPromociones(negocioId);
        setPromociones(promocionesData);

        const productosData = await fetchProductos(negocioId);
        setProductos(productosData.filter((p) => p.activo));
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las promociones.');
      } finally {
        setLoading(false);
      }
    }

    cargar();
  }, [negocioId]);

 async function agregarPromocion() {
  if (!negocioId) {
    setError('No se encontró el negocio.');
    return;
  }

  if (!nombre.trim()) {
    setError('Ingresá un nombre para la campaña.');
    return;
  }

  if (!productoSeleccionado) {
    setError('Seleccioná un producto para la campaña.');
    return;
  }

  if (cantidadPromo <= 0) {
    setError('La cantidad debe ser mayor a 0.');
    return;
  }

  if (precioPromo <= 0) {
    setError('Ingresá un precio promocional válido.');
    return;
  }

  try {
    const creada = await createPromocion(negocioId, {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      fechaDesde: fechaDesde || null,
      fechaHasta: fechaHasta || null,
    });

    await createPromocionDetalle({
      negocioId,
      promocionId: creada.id,
      productoId: productoSeleccionado,
      cantidad: cantidadPromo,
      precioPromocional: precioPromo,
    });

    setPromociones((actuales) => [creada, ...actuales]);

    setNombre('');
    setDescripcion('');
    setFechaDesde('');
    setFechaHasta('');
    setProductoSeleccionado('');
    setCantidadPromo(1);
    setPrecioPromo(0);
    setError('');
  } catch (err) {
    console.error(err);
    setError('No se pudo crear la campaña.');
  }
}

  async function cambiarEstado(promocion: PromocionAdmin) {
    try {
      const actualizada = await updatePromocion(promocion.id, {
        activa: !promocion.activa,
      });

      setPromociones((actuales) =>
        actuales.map((p) =>
          p.id === actualizada.id ? actualizada : p
        )
      );

      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo cambiar el estado de la campaña.');
    }
  }

  async function eliminarPromocion(promocion: PromocionAdmin) {
    const confirmar = window.confirm(
      `¿Seguro que querés eliminar la promoción "${promocion.nombre}"?`
    );

    if (!confirmar) return;

    try {
      await deletePromocion(promocion.id);

      setPromociones((actuales) =>
        actuales.filter((p) => p.id !== promocion.id)
      );

      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar la promoción.');
    }
  }

  async function agregarDetallePromocion(promocionId: string) {
    if (!negocioId) {
      setError('No se encontró el negocio.');
      return;
    }

    if (!productoSeleccionado) {
      setError('Seleccioná un producto.');
      return;
    }

    if (cantidadPromo <= 0) {
      setError('La cantidad debe ser mayor a 0.');
      return;
    }

    if (precioPromo < 0) {
      setError('El precio promocional no puede ser negativo.');
      return;
    }

    try {
      const creado = await createPromocionDetalle({
        negocioId,
        promocionId,
        productoId: productoSeleccionado,
        cantidad: cantidadPromo,
        precioPromocional: precioPromo,
      });

      setDetalles((actuales) => [...actuales, creado]);

      setProductoSeleccionado('');
      setCantidadPromo(1);
      setPrecioPromo(0);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo agregar el producto a la promoción.');
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Administración de Campañas
      </h1>

      <div className="mb-6 rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">
          Nueva campaña
        </h2>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="text"
            placeholder="Nombre de la campaña"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <input
            type="text"
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
        </div>
<div className="grid gap-3 md:grid-cols-3 mt-3">
  <select
    value={productoSeleccionado}
    onChange={(e) => setProductoSeleccionado(e.target.value)}
    className="rounded-md border px-3 py-2"
  >
    <option value="">Seleccionar producto</option>

    {productos.map((producto) => (
      <option key={producto.id} value={producto.id}>
        {producto.nombre}
      </option>
    ))}
  </select>

  <input
    type="number"
    min={1}
    placeholder="Cantidad"
    value={cantidadPromo}
    onChange={(e) =>
      setCantidadPromo(Math.max(1, Number(e.target.value)))
    }
    className="rounded-md border px-3 py-2"
  />

  <input
    type="number"
    min={0}
    placeholder="Precio promoción"
    value={precioPromo}
    onChange={(e) =>
      setPrecioPromo(Number(e.target.value))
    }
    className="rounded-md border px-3 py-2"
  />
</div>
        <button
          onClick={agregarPromocion}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          Crear campaña
        </button>
      </div>

      {error && (
        <p className="mb-4 text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-muted-foreground">
          Cargando campañas...
        </p>
      ) : (
        <div className="space-y-3">
          {promociones.map((promocion) => (
            <div
              key={promocion.id}
              className="rounded-lg border p-4"
            >
              <div className="font-semibold">
                {promocion.nombre}
              </div>

              <div className="text-sm text-muted-foreground">
                {promocion.descripcion}
              </div>

              <div className="mt-2 text-sm">
                Desde: {promocion.fechaDesde || '-'}
              </div>

              <div className="text-sm">
                Hasta: {promocion.fechaHasta || '-'}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm">
                  Estado: {promocion.activa ? 'Activa' : 'Inactiva'}
                </span>

                <button
                  onClick={() => cambiarEstado(promocion)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  {promocion.activa ? 'Desactivar' : 'Activar'}
                </button>

                <button
                  onClick={() => eliminarPromocion(promocion)}
                  className="rounded-md border px-3 py-2 text-sm text-destructive"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}