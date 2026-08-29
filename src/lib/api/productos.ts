import { supabase } from '@/integrations/supabase/client';
import type { Producto } from '@/types';

function mapRow(row: any): Producto {
  return {
    id: row.id,
    nombre: row.nombre,
    tipo: row.tipo,
    formato: row.formato || undefined,
  };
}

export async function fetchProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapRow);
}
