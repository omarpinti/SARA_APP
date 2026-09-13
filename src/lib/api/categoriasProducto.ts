import { supabase } from '@/integrations/supabase/client';

// Las tablas categorias_producto / formatos_producto son nuevas;
// hasta que se regeneren los tipos de Supabase, el cliente no las
// conoce de forma automática. Este cast puntual evita ruido de
// TypeScript sin afectar el comportamiento real.
const db = supabase as any;

export interface OpcionProducto {
  id: string;
  nombre: string;
}

export async function fetchCategorias(negocioId: string): Promise<OpcionProducto[]> {
  const { data, error } = await db
    .from('categorias_producto')
    .select('id, nombre')
    .eq('negocio_id', negocioId)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function crearCategoria(negocioId: string, nombre: string): Promise<OpcionProducto> {
  const { data, error } = await db
    .from('categorias_producto')
    .insert({ negocio_id: negocioId, nombre: nombre.trim() })
    .select('id, nombre')
    .single();

  if (error) throw error;
  return data;
}

export async function fetchFormatos(negocioId: string): Promise<OpcionProducto[]> {
  const { data, error } = await db
    .from('formatos_producto')
    .select('id, nombre')
    .eq('negocio_id', negocioId)
    .order('nombre', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function crearFormato(negocioId: string, nombre: string): Promise<OpcionProducto> {
  const { data, error } = await db
    .from('formatos_producto')
    .insert({ negocio_id: negocioId, nombre: nombre.trim() })
    .select('id, nombre')
    .single();

  if (error) throw error;
  return data;
}
