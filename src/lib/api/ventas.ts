import { supabase } from '@/integrations/supabase/client';

export interface VentaDetalleInput {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface CrearVentaInput {
  negocio_id: string;
  cliente_id: string;
  pedido_id?: string | null;
  fecha: string;
  estado_pago: 'pagado' | 'pendiente' | 'parcial';
  forma_pago: 'efectivo' | 'transferencia' | 'otro';
  total: number;
  monto_pagado: number;
  saldo_pendiente: number;
  observaciones?: string | null;
  detalles: VentaDetalleInput[];
}

export async function createVenta(input: CrearVentaInput) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error('Usuario no autenticado');

  const { detalles, ...ventaData } = input;

  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      ...ventaData,
      created_by: user.id,
    })
    .select()
    .single();

  if (ventaError) throw ventaError;

  if (detalles.length > 0) {
    const detalleRows = detalles.map((detalle) => ({
      negocio_id: input.negocio_id,
      venta_id: venta.id,
      producto_id: detalle.producto_id,
      cantidad: detalle.cantidad,
      precio_unitario: detalle.precio_unitario,
      subtotal: detalle.subtotal,
    }));

    const { error: detalleError } = await supabase
      .from('venta_detalle')
      .insert(detalleRows);

    if (detalleError) throw detalleError;
  }

  return venta;
}