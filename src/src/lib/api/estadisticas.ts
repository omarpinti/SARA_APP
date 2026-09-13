import { supabase } from '@/integrations/supabase/client';

export interface VentaEstadistica {
  id: string;
  fecha: string;
  clienteId: string;
  precio: number;
  formaPago: string;
  estadoPago: string;
  entregamos: number;
  llevamos: number;
}

function mapVenta(row: any): VentaEstadistica {
  return {
    id: row.id,
    fecha: row.fecha,
    clienteId: row.cliente_id,
    precio: Number(row.precio) || 0,
    formaPago: row.forma_pago,
    estadoPago: row.estado_pago,
    entregamos: row.entregamos || 0,
    llevamos: row.llevamos || 0,
  };
}

export async function fetchVentasRango(
  negocioId: string,
  fromStr: string,
  toStr: string
): Promise<VentaEstadistica[]> {
  const { data, error } = await supabase
    .from('ventas')
    .select('id, fecha, cliente_id, precio, forma_pago, estado_pago, entregamos, llevamos')
    .eq('negocio_id', negocioId)
    .gte('fecha', fromStr)
    .lte('fecha', toStr);

  if (error) throw error;
  return (data || []).map(mapVenta);
}

// Cantidad de clientes con saldo pendiente, sin importar el período elegido
export async function fetchClientesConDeuda(negocioId: string): Promise<number> {
  const { data, error } = await supabase
    .from('ventas')
    .select('cliente_id')
    .eq('negocio_id', negocioId)
    .eq('estado_pago', 'pendiente');

  if (error) throw error;
  return new Set((data || []).map((v) => v.cliente_id)).size;
}

export interface DetalleEstadistica {
  ventaId: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  subtotal: number;
}

export async function fetchDetalleVentasPorIds(
  negocioId: string,
  ventaIds: string[]
): Promise<DetalleEstadistica[]> {
  if (ventaIds.length === 0) return [];

  const { data, error } = await supabase
    .from('venta_detalle')
    .select('venta_id, producto_id, cantidad, subtotal, productos(nombre)')
    .eq('negocio_id', negocioId)
    .in('venta_id', ventaIds);

  if (error) throw error;
  return (data || []).map((row: any) => ({
    ventaId: row.venta_id,
    productoId: row.producto_id,
    productoNombre: row.productos?.nombre || 'Producto',
    cantidad: row.cantidad,
    subtotal: Number(row.subtotal) || 0,
  }));
}

export async function fetchGastosRango(negocioId: string, fromStr: string, toStr: string) {
  const { data, error } = await supabase
    .from('gastos')
    .select('id, fecha, detalle, monto, forma_pago')
    .eq('negocio_id', negocioId)
    .gte('fecha', fromStr)
    .lte('fecha', toStr);

  if (error) throw error;
  return data || [];
}
