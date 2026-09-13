import { supabase } from '@/integrations/supabase/client';

export interface PromocionAdmin {
  id: string;
  negocioId: string;
  nombre: string;
  descripcion: string;
  fechaDesde: string | null;
  fechaHasta: string | null;
  activa: boolean;
  tipo: string;
}

function mapRow(row: any): PromocionAdmin {
  return {
    id: row.id,
    negocioId: row.negocio_id,
    nombre: row.nombre,
    descripcion: row.descripcion ?? '',
    fechaDesde: row.fecha_desde,
    fechaHasta: row.fecha_hasta,
    activa: row.activa ?? true,
    tipo: row.tipo ?? 'precio_especial',
  };
}

export async function fetchPromociones(
  negocioId: string
): Promise<PromocionAdmin[]> {
  const { data, error } = await supabase
    .from('promociones')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapRow);
}

export async function createPromocion(
  negocioId: string,
  promocion: {
    nombre: string;
    descripcion?: string;
    fechaDesde?: string | null;
    fechaHasta?: string | null;
  }
): Promise<PromocionAdmin> {
  const { data, error } = await supabase
    .from('promociones')
    .insert({
      negocio_id: negocioId,
      nombre: promocion.nombre,
      descripcion: promocion.descripcion ?? '',
      fecha_desde: promocion.fechaDesde ?? null,
      fecha_hasta: promocion.fechaHasta ?? null,
      activa: true,
      tipo: 'precio_especial',
    })
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function updatePromocion(
  id: string,
  cambios: Partial<{
    nombre: string;
    descripcion: string;
    fechaDesde: string | null;
    fechaHasta: string | null;
    activa: boolean;
  }>
): Promise<PromocionAdmin> {
  const payload: any = {};

  if (cambios.nombre !== undefined) payload.nombre = cambios.nombre;
  if (cambios.descripcion !== undefined) payload.descripcion = cambios.descripcion;
  if (cambios.fechaDesde !== undefined) payload.fecha_desde = cambios.fechaDesde;
  if (cambios.fechaHasta !== undefined) payload.fecha_hasta = cambios.fechaHasta;
  if (cambios.activa !== undefined) payload.activa = cambios.activa;

  const { data, error } = await supabase
    .from('promociones')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}

export async function deletePromocion(id: string): Promise<void> {
  const { error } = await supabase
    .from('promociones')
    .delete()
    .eq('id', id);

  if (error) throw error;
}