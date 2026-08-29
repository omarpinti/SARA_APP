import { supabase } from '@/integrations/supabase/client';
import type { Cliente } from '@/types';

function mapRow(row: any): Cliente {
  return {
    id: row.id,
    numero: row.numero,
    nombre: row.nombre,
    apellido: row.apellido,
    telefono: row.telefono || '',
    direccion: row.direccion || '',
    fechaAlta: row.fecha_alta,
  };
}

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('numero', { ascending: true });

  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function createCliente(cliente: Omit<Cliente, 'id' | 'numero'>): Promise<Cliente> {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono || null,
      direccion: cliente.direccion || null,
      fecha_alta: cliente.fechaAlta,
    })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function updateCliente(id: string, cliente: Partial<Cliente>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (cliente.nombre !== undefined) payload.nombre = cliente.nombre;
  if (cliente.apellido !== undefined) payload.apellido = cliente.apellido;
  if (cliente.telefono !== undefined) payload.telefono = cliente.telefono;
  if (cliente.direccion !== undefined) payload.direccion = cliente.direccion;
  if (cliente.fechaAlta !== undefined) payload.fecha_alta = cliente.fechaAlta;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from('clientes').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deleteCliente(id: string): Promise<void> {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}
