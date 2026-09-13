import { useEffect, useState } from 'react';
import {
  fetchProductos,
  updateProducto,
  createProducto,
  eliminarProductoDefinitivo,
} from '@/lib/api/productos';
import {
  fetchCategorias,
  crearCategoria,
  fetchFormatos,
  crearFormato,
  type OpcionProducto,
} from '@/lib/api/categoriasProducto';
import type { Producto } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AdministracionProductos() {
  const { negocioId } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<OpcionProducto[]>([]);
  const [formatos, setFormatos] = useState<OpcionProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [nuevoFormato, setNuevoFormato] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState(0);

  useEffect(() => {
    async function cargarTodo() {
      if (!negocioId) return;
      try {
        const [dataProductos, dataCategorias, dataFormatos] = await Promise.all([
          fetchProductos(),
          fetchCategorias(negocioId),
          fetchFormatos(negocioId),
        ]);
        setProductos(dataProductos);
        setCategorias(dataCategorias);
        setFormatos(dataFormatos);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los productos.');
      } finally {
        setLoading(false);
      }
    }

    cargarTodo();
  }, [negocioId]);

  // Si la categoría/formato escritos no existen todavía, los crea.
  // Si ya existen (comparando sin importar mayúsculas), no hace nada.
  async function asegurarCategoria(nombre: string) {
    if (!negocioId || !nombre.trim()) return;
    const existe = categorias.some((c) => c.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (existe) return;
    try {
      const creada = await crearCategoria(negocioId, nombre.trim());
      setCategorias((actuales) => [...actuales, creada]);
    } catch (err) {
      // Si ya existía (carrera con otra pestaña, etc.) lo ignoramos.
      console.warn('No se pudo registrar la categoría como opción futura:', err);
    }
  }

  async function asegurarFormato(nombre: string) {
    if (!negocioId || !nombre.trim()) return;
    const existe = formatos.some((f) => f.nombre.toLowerCase() === nombre.trim().toLowerCase());
    if (existe) return;
    try {
      const creado = await crearFormato(negocioId, nombre.trim());
      setFormatos((actuales) => [...actuales, creado]);
    } catch (err) {
      console.warn('No se pudo registrar el formato como opción futura:', err);
    }
  }

  async function cambiarPrecio(producto: Producto, precio: number) {
    try {
      const actualizado = await updateProducto(producto.id, { precioDefault: precio });
      setProductos((actuales) => actuales.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo actualizar el precio.');
    }
  }

  async function cambiarEstado(producto: Producto) {
    try {
      const actualizado = await updateProducto(producto.id, { activo: !producto.activo });
      setProductos((actuales) => actuales.map((p) => (p.id === actualizado.id ? actualizado : p)));
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo cambiar el estado del producto.');
    }
  }

  async function eliminarProducto(producto: Producto) {
    const confirmado = confirm(
      `¿Eliminar "${producto.nombre}" definitivamente? Esta acción no se puede deshacer.`
    );
    if (!confirmado) return;

    try {
      await eliminarProductoDefinitivo(producto.id);
      setProductos((actuales) => actuales.filter((p) => p.id !== producto.id));
      setError('');
    } catch (err) {
      console.error(err);
      setError(
        `No se pudo eliminar "${producto.nombre}": probablemente ya tiene ventas o pedidos asociados. Usá "Dar de baja" en su lugar.`
      );
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
    if (!nuevaCategoria.trim()) {
      setError('Completá la categoría del producto (puede ser cualquier texto, ej: café).');
      return;
    }

    try {
      // Registra la categoría/formato como opciones futuras si son nuevas.
      await asegurarCategoria(nuevaCategoria);
      if (nuevoFormato.trim()) await asegurarFormato(nuevoFormato);

      const creado = await createProducto(
        {
          nombre: nuevoNombre.trim(),
          tipo: nuevaCategoria.trim(),
          formato: nuevoFormato.trim() || undefined,
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
      setNuevaCategoria('');
      setNuevoFormato('');
      setNuevoPrecio(0);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo agregar el producto.');
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Administración de Productos</h1>

      <div className="mb-6 rounded-lg border p-4">
        <h2 className="mb-4 text-lg font-semibold">Agregar producto</h2>

        <div className="grid gap-3 md:grid-cols-5">
          <input
            type="text"
            placeholder="Nombre (ej: Café, Bidón 10L)"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            className="rounded-md border px-3 py-2"
          />

          <input
            type="text"
            list="categorias-sugeridas"
            placeholder="Categoría (la que quieras)"
            value={nuevaCategoria}
            onChange={(e) => setNuevaCategoria(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
          <datalist id="categorias-sugeridas">
            {categorias.map((c) => (
              <option key={c.id} value={c.nombre} />
            ))}
          </datalist>

          <input
            type="text"
            list="formatos-sugeridos"
            placeholder="Formato (opcional)"
            value={nuevoFormato}
            onChange={(e) => setNuevoFormato(e.target.value)}
            className="rounded-md border px-3 py-2"
          />
          <datalist id="formatos-sugeridos">
            {formatos.map((f) => (
              <option key={f.id} value={f.nombre} />
            ))}
          </datalist>

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
        <p className="mt-2 text-xs text-muted-foreground">
          Escribí la categoría y el formato que quieras (podés elegir uno ya usado o escribir uno nuevo,
          se guarda solo). El formato es opcional: dejalo vacío si no aplica, como en café o accesorios.
        </p>
      </div>

      {loading && <p className="text-muted-foreground">Cargando productos...</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="space-y-3">
          {productos.map((producto) => (
            <div key={producto.id} className="border rounded-lg p-4">
              <div className="font-semibold">{producto.nombre}</div>

              <div className="text-sm text-muted-foreground">
                Categoría: {producto.tipo}
                {producto.formato && ` · Formato: ${producto.formato}`}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <label className="text-sm font-medium">Precio:</label>
                <input
                  type="number"
                  value={producto.precioDefault}
                  onChange={(e) => {
                    const precio = Number(e.target.value);
                    setProductos((actuales) =>
                      actuales.map((p) => (p.id === producto.id ? { ...p, precioDefault: precio } : p))
                    );
                  }}
                  className="w-32 rounded-md border px-3 py-2"
                />
                <button
                  onClick={() => cambiarPrecio(producto, producto.precioDefault)}
                  className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
                >
                  Guardar
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="text-sm">Estado: {producto.activo ? 'Activo' : 'Inactivo'}</span>
                <button
                  onClick={() => cambiarEstado(producto)}
                  className="rounded-md border px-3 py-2 text-sm"
                >
                  {producto.activo ? 'Dar de baja' : 'Activar'}
                </button>
                <button
                  onClick={() => eliminarProducto(producto)}
                  className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                >
                  Eliminar producto
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
