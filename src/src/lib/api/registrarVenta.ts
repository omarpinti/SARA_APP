import { supabase } from '@/integrations/supabase/client';

export type ItemVentaGuardar = {
  productoId: string;
  promocionId?: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
};

type RegistrarVentaCompletaParams = {
  negocioId: string;
  clienteId: string;
  fecha: string;
  fechaPago?: string;
  formaPago: string;
  estadoPago: string;
  entregamos: number;
  llevamos: number;
  observaciones?: string;
  items: ItemVentaGuardar[];
};

export async function registrarVentaCompleta({
  negocioId,
  clienteId,
  fecha,
  fechaPago,
  formaPago,
  estadoPago,
  entregamos,
  llevamos,
  observaciones,
  items,
}: RegistrarVentaCompletaParams) {
  if (items.length === 0) {
    throw new Error('La venta no tiene productos');
  }

  const total = items.reduce(
    (acumulado, item) => acumulado + item.subtotal,
    0
  );

  const primerItem = items[0];

  const { data: venta, error: ventaError } = await supabase
    .from('ventas')
    .insert({
      negocio_id: negocioId,
      cliente_id: clienteId,
      fecha,
      fecha_pago: estadoPago === 'pagado' ? fechaPago ?? fecha : null,
      forma_pago: formaPago,
      estado_pago: estadoPago,
      producto_id: primerItem.productoId,
      promocion_id: primerItem.promocionId ?? null,
      precio: total,
      entregamos,
      llevamos,
      observaciones: observaciones || null,
    })
    .select()
    .single();

  if (ventaError) {
    throw ventaError;
  }

  const detalles = items.map((item) => ({
    negocio_id: negocioId,
    venta_id: venta.id,
    producto_id: item.productoId,
    promocion_id: item.promocionId ?? null,
    cantidad: item.cantidad,
    precio_unitario: item.precioUnitario,
    subtotal: item.subtotal,
  }));

    const { error: detalleError } = await supabase
    .from('venta_detalle')
    .insert(detalles);

  if (detalleError) {
    // Evita dejar una venta vacía si falla el detalle.
    await supabase
      .from('ventas')
      .delete()
      .eq('id', venta.id);

    throw detalleError;
  }

  if (estadoPago === 'pagado') {
    const { error: movimientoError } = await supabase
      .from('movimientos_caja')
      .insert({
        negocio_id: negocioId,
        tipo: 'ingreso',
        monto: total,
        fecha_hora: new Date(
          `${fechaPago ?? fecha}T12:00:00`
        ).toISOString(),
        origen: 'venta',
        ref_id: venta.id,
        forma_pago: formaPago,
      });

    if (movimientoError) {
      await supabase
        .from('venta_detalle')
        .delete()
        .eq('venta_id', venta.id);

      await supabase
        .from('ventas')
        .delete()
        .eq('id', venta.id);

      throw movimientoError;
    }
  }

  return venta;
}

export async function fetchVentasCompletas(negocioId: string) {
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      *,
      venta_detalle (
        id,
        producto_id,
        promocion_id,
        cantidad,
        precio_unitario,
        subtotal
      )
    `)
    .eq('negocio_id', negocioId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}
export async function eliminarVentaCompleta(ventaId: string) {
  const { error: detalleError } = await supabase
    .from('venta_detalle')
    .delete()
    .eq('venta_id', ventaId);

  if (detalleError) {
    throw detalleError;
  }
  const { error: movimientoError } = await supabase
  .from('movimientos_caja')
  .delete()
  .eq('origen', 'venta')
  .eq('ref_id', ventaId);

if (movimientoError) {
  throw movimientoError;
}
  const { error: ventaError } = await supabase
    .from('ventas')
    .delete()
    .eq('id', ventaId);

  if (ventaError) {
    throw ventaError;
  }
}
export async function actualizarVentaCompleta(
  ventaId: string,
  {
    negocioId,
    clienteId,
    fecha,
    fechaPago,
    formaPago,
    estadoPago,
    entregamos,
    llevamos,
    observaciones,
    items,
  }: Omit<RegistrarVentaCompletaParams, 'negocioId'>
) {
  if (items.length === 0) {
    throw new Error('La venta no tiene productos');
  }

  const total = items.reduce(
    (acumulado, item) => acumulado + item.subtotal,
    0
  );

  const primerItem = items[0];

  const { error: ventaError } = await supabase
    .from('ventas')
    .update({
      cliente_id: clienteId,
      fecha,
      fecha_pago:
        estadoPago === 'pagado'
          ? fechaPago ?? fecha
          : null,
      forma_pago: formaPago,
      estado_pago: estadoPago,
      producto_id: primerItem.productoId,
      promocion_id: primerItem.promocionId ?? null,
      precio: total,
      entregamos,
      llevamos,
      observaciones: observaciones || null,
    })
    .eq('id', ventaId);

  if (ventaError) {
    throw ventaError;
  }

  const { error: borrarDetalleError } = await supabase
    .from('venta_detalle')
    .delete()
    .eq('venta_id', ventaId);

  if (borrarDetalleError) {
    throw borrarDetalleError;
  }

const detalles = items.map((item) => ({
  negocio_id: negocioId,
  venta_id: ventaId,
  producto_id: item.productoId,
  promocion_id: item.promocionId ?? null,
  cantidad: item.cantidad,
  precio_unitario: item.precioUnitario,
  subtotal: item.subtotal,
}));
  const { error: detalleError } = await supabase
    .from('venta_detalle')
    .insert(detalles);

 if (detalleError) {
  throw detalleError;
}

if (estadoPago === 'pagado') {
  const { error: movimientoError } = await supabase
    .from('movimientos_caja')
    .upsert(
      {
        negocio_id: negocioId,
        tipo: 'ingreso',
        monto: total,
        fecha_hora: new Date(`${fechaPago ?? fecha}T12:00:00`).toISOString(),
        origen: 'venta',
        ref_id: ventaId,
        forma_pago: formaPago,
      },
      {
        onConflict: 'ref_id',
      }
    );

  if (movimientoError) {
    throw movimientoError;
  }
} else {
  const { error: movimientoError } = await supabase
    .from('movimientos_caja')
    .delete()
    .eq('origen', 'venta')
    .eq('ref_id', ventaId);

  if (movimientoError) {
    throw movimientoError;
  }}
}