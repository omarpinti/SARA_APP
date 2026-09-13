import { useEffect, useState } from 'react';
import {
  fetchProductos,
  updateProducto,
  createProducto,
} from '@/lib/api/productos';
import type { Producto } from '@/types';
import { useAuth } from "@/contexts/AuthContext";

export default function AdministracionProductos() {
  const { negocioId } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState('bidon_10');
  const [nuevoFormato, setNuevoFormato] = useState<'pico' | 'dispenser' | ''>('');
 const [nuevoPrecio, setNuevoPrecio] = useState(0);

const TIPOS_VALIDOS = [
  { value: 'bidon_6', label: 'Bidón 6 Litros' },
  { value: 'bidon_10', label: 'Bidón 10 Litros' },
  { value: 'bidon_20', label: 'Bidón 20 Litros' },
  { value: 'pack', label: 'Pack' },
];

async function cambiarPrecio(producto: Producto, nuevoPrecio: number) {
  try {
    const actualizado = await updateProducto(producto.id, {
      precioDefault: nuevoPrecio,
    });

    setProductos((actuales) =>
      actuales.map((p) =>
        p.id === actualizado.id ? actualizado : p
      )
    );

    setError('');
  } catch (err) {
    console.error(err);
    setError('No se pudo actualizar el precio.');
  }
}

async function cambiarEstado(producto: Producto) {
  try {
    const actualizado = await updateProducto(producto.id, {
      activo: !producto.activo,
    });

    setProductos((actuales) =>
      actuales.map((p) =>
        p.id === actualizado.id ? actualizado : p
      )
    );

    setError('');
  } catch (err) {
    console.error(err);
    setError('No se pudo cambiar el estado del producto.');
  }
}
async function agregarProducto() {
  if (!negocioId) {
    setError('No se encontró el negocio.');
    return;
  }

  if (!nuevoNombre.trim()) {
    setError('Completá el nombre del producto.');
    return;
  }
  if (!nuevoTipo) {
    setError('Elegí el tipo de producto.');
    return;
  }

  try {
    const creado = await createProducto(
      {
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo,
        formato: nuevoFormato || undefined,
        precioDefault: nuevoPrecio,
        activo: true,
        requiereEnvase: false,
        permiteRecambio: false,
        descuentaStock: true,
        orden: productos.length + 1,
      },
      negocioId
    );

    setProductos((actuales) => [...actuales, creado]);

    setNuevoNombre('');
    setNuevoTipo('bidon_10');
    setNuevoFormato('');
    setNuevoPrecio(0);
    setError('');
  } catch (err) {
    console.error(err);
    setError('No se pudo agregar el producto.');
  }
}


  useEffect(() => {
    async function cargarProductos() {
      try {
        const data = await fetchProductos();
        setProductos(data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    }

    cargarProductos();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Administración de Productos
      </h1>
      <div className="mb-6 rounded-lg border p-4">
  <h2 className="mb-4 text-lg font-semibold">
    Agregar producto
  </h2>

  <div className="grid gap-3 md:grid-cols-5">
    <input
      type="text"
      placeholder="Nombre"
      value={nuevoNombre}
      onChange={(e) => setNuevoNombre(e.target.value)}
      className="rounded-md border px-3 py-2"
    />

    <select
      value={nuevoTipo}
      onChange={(e) => setNuevoTipo(e.target.value)}
      className="rounded-md border px-3 py-2"
    >
      {TIPOS_VALIDOS.map((t) => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>

    <select
      value={nuevoFormato}
      onChange={(e) => setNuevoFormato(e.target.value as 'pico' | 'dispenser' | '')}
      className="rounded-md border px-3 py-2"
    >
      <option value="">Sin formato (ej: Pack)</option>
      <option value="pico">Pico / Canilla</option>
      <option value="dispenser">Dispenser</option>
    </select>

    <input
      type="number"
      placeholder="Precio"
      value={nuevoPrecio}
      onChange={(e) => setNuevoPrecio(Number(e.target.value))}
      className="rounded-md border px-3 py-2"
    />

    <button
      onClick={agregarProducto}
      className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
    >
      Agregar producto
    </button>
  </div>
</div>

      {loading && (
        <p className="text-muted-foreground">
          Cargando productos...
        </p>
      )}

      {error && (
        <p className="text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="border rounded-lg p-4"
            >
              <div className="font-semibold">
                {producto.nombre}
              </div>

              <div className="text-sm text-muted-foreground">
                Tipo: {producto.tipo}
                {producto.formato && ` · Formato: ${producto.formato === 'pico' ? 'Pico / Canilla' : 'Dispenser'}`}
              </div>

              <div className="mt-3 flex items-center gap-2">
  <label className="text-sm font-medium">
    Precio:
  </label>

  <input
    type="number"
    value={producto.precioDefault}
    onChange={(e) => {
      const nuevoPrecio = Number(e.target.value);

      setProductos((actuales) =>
        actuales.map((p) =>
          p.id === producto.id
            ? { ...p, precioDefault: nuevoPrecio }
            : p
        )
      );
    }}
    className="w-32 rounded-md border px-3 py-2"
  />

  <button
    onClick={() =>
      cambiarPrecio(producto, producto.precioDefault)
    }
    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
  >
    Guardar
  </button>
</div>

   <div className="mt-3 flex items-center gap-3">
  <span className="text-sm">
    Estado: {producto.activo ? 'Activo' : 'Inactivo'}
  </span>

  <button
    onClick={() => cambiarEstado(producto)}
    className="rounded-md border px-3 py-2 text-sm"
  >
    {producto.activo ? 'Dar de baja' : 'Activar'}
  </button>
</div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}