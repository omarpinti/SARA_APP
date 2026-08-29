import { supabase } from '@/integrations/supabase/client';
import type { Pedido } from '@/types';

function mapRow(row: any): Pedido {
  return {
    id: row.id,
    fecha: row.fecha,
    clienteId: row.cliente_id,
    estado: row.estado,
    observaciones: row.observaciones || '',
    detalles: (row.pedido_detalle || []).map((d: any) => ({
      id: d.id,
      pedidoId: row.id,
      productoId: d.producto_id,
      cantidad: d.cantidad,
    })),
  };
}

const SELECT_CON_DETALLE = '*, pedido_detalle(*)';

export async function fetchPedidos(): Promise<Pedido[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(SELECT_CON_DETALLE)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return (data || []).map(mapRow);
}

async function fetchPedidoById(id: string): Promise<Pedido> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(SELECT_CON_DETALLE)
    .eq('id', id)
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function createPedido(pedido: Omit<Pedido, 'id'>): Promise<Pedido> {
  const { data: pedidoRow, error } = await supabase
    .from('pedidos')
    .insert({
      fecha: pedido.fecha,
      cliente_id: pedido.clienteId,
      estado: pedido.estado,
      observaciones: pedido.observaciones || null,
    })
    .select()
    .single();

  if (error) throw error;

  if (pedido.detalles.length > 0) {
    const { error: detalleError } = await supabase.from('pedido_detalle').insert(
      pedido.detalles.map((d) => ({
        pedido_id: pedidoRow.id,
        producto_id: d.productoId,
        cantidad: d.cantidad,
      }))
    );
    if (detalleError) throw detalleError;
  }

  return fetchPedidoById(pedidoRow.id);
}

export async function updatePedido(id: string, pedido: Partial<Pedido>): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (pedido.estado !== undefined) payload.estado = pedido.estado;
  if (pedido.observaciones !== undefined) payload.observaciones = pedido.observaciones;
  if (pedido.fecha !== undefined) payload.fecha = pedido.fecha;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from('pedidos').update(payload).eq('id', id);
  if (error) throw error;
}

export async function deletePedido(id: string): Promise<void> {
  const { error } = await supabase.from('pedidos').delete().eq('id', id);
  if (error) throw error;
}
