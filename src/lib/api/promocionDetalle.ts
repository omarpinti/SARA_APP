import { supabase } from '@/integrations/supabase/client';

export interface PromocionDetalleAdmin {
  id: string;
  negocioId: string;
  promocionId: string;
  productoId: string;
  cantidad: number;
  precioPromocional: number;
}

function mapRow(row: any): PromocionDetalleAdmin {
  return {
    id: row.id,
    negocioId: row.negocio_id,
    promocionId: row.promocion_id,
    productoId: row.producto_id,
    cantidad: row.cantidad,
    precioPromocional: row.precio_promocional,
  };
}

export async function fetchPromocionDetalles(
  promocionId: string
): Promise<PromocionDetalleAdmin[]> {
  const { data, error } = await supabase
    .from('promocion_detalle')
    .select('*')
    .eq('promocion_id', promocionId)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data || []).map(mapRow);
}

export async function createPromocionDetalle(
  detalle: {
    negocioId: string;
    promocionId: string;
    productoId: string;
    cantidad: number;
    precioPromocional: number;
  }
): Promise<PromocionDetalleAdmin> {
  const { data, error } = await supabase
    .from('promocion_detalle')
    .insert({
      negocio_id: detalle.negocioId,
      promocion_id: detalle.promocionId,
      producto_id: detalle.productoId,
      cantidad: detalle.cantidad,
      precio_promocional: detalle.precioPromocional,
    })
    .select()
    .single();

  if (error) throw error;

  return mapRow(data);
}