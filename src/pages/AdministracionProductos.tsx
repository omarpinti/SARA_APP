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
  const [nuevoTipo, setNuevoTipo] = useState('');
 const [nuevoPrecio, setNuevoPrecio] = useState(0);

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

  if (!nuevoNombre.trim() || !nuevoTipo.trim()) {
    setError('Completá nombre y tipo.');
    return;
  }

  try {
    const creado = await createProducto(
      {
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo.trim().toLowerCase(),
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
    setNuevoTipo('');
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

  <div className="grid gap-3 md:grid-cols-4">
    <input
      type="text"
      placeholder="Nombre"
      value={nuevoNombre}
      onChange={(e) => setNuevoNombre(e.target.value)}
      className="rounded-md border px-3 py-2"
    />

    <input
      type="text"
      placeholder="Tipo"
      value={nuevoTipo}
      onChange={(e) => setNuevoTipo(e.target.value)}
      className="rounded-md border px-3 py-2"
    />

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