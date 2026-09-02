import { supabase } from '@/integrations/supabase/client';
import type { Producto } from '@/types';

function mapRow(row: any): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    formato: row.formato || undefined,

    precioDefault: row.precio_default ?? 0,
    activo: row.activo ?? true,
    requiereEnvase: row.requiere_envase ?? false,
    permiteRecambio: row.permite_recambio ?? false,
    descuentaStock: row.descuenta_stock ?? true,
    orden: row.orden ?? 0,
  };
}

export async function fetchProductos(negocioId?: string): Promise<Producto[]> {
  let query = supabase
    .from('productos')
    .select('*')
    .order('orden', { ascending: true })
    .order('created_at', { ascending: true });

  if (negocioId) {
    query = query.eq('negocio_id', negocioId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapRow);
}

export async function createProducto(
  producto: Omit<Producto, 'id'>,
  negocioId: string
): Promise<Producto> {
  const { data, error } = await supabase
    .from('productos')
    .insert({
      negocio_id: negocioId,
      nombre: producto.nombre,
      tipo: producto.tipo,
      precio_default: producto.precioDefault ?? 0,
      activo: producto.activo ?? true,
      requiere_envase: producto.requiereEnvase ?? false,
      permite_recambio: producto.permiteRecambio ?? false,
      descuenta_stock: producto.descuentaStock ?? true,
      orden: producto.orden ?? 0,
    })
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function updateProducto(
  id: string,
  producto: Partial<Producto>
): Promise<Producto> {
  const payload: any = {};

  if (producto.nombre !== undefined) payload.nombre = producto.nombre;
  if (producto.tipo !== undefined) payload.tipo = producto.tipo;
  if (producto.precioDefault !== undefined) payload.precio_default = producto.precioDefault;
  if (producto.activo !== undefined) payload.activo = producto.activo;
  if (producto.requiereEnvase !== undefined) payload.requiere_envase = producto.requiereEnvase;
  if (producto.permiteRecambio !== undefined) payload.permite_recambio = producto.permiteRecambio;
  if (producto.descuentaStock !== undefined) payload.descuenta_stock = producto.descuentaStock;
  if (producto.orden !== undefined) payload.orden = producto.orden;

  const { data, error } = await supabase
    .from('productos')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function deleteProducto(id: string): Promise<void> {
  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id);

  if (error) throw error;
}
