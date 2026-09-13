import { supabase } from '@/integrations/supabase/client';

type FormaPagoGasto =
  | 'efectivo'
  | 'transferencia'
  | 'pendiente'
  | 'cuenta_corriente';

type EstadoPagoGasto = 'pagado' | 'pendiente';

type RegistrarGastoParams = {
  negocioId: string;
  fecha: string;
  fechaPago?: string | null;
  detalle: string;
  monto: number;
  formaPago: FormaPagoGasto;
  estadoPago: EstadoPagoGasto;
  observaciones?: string;
};

type ActualizarGastoParams = {
  negocioId: string;
  gastoId: string;
  fecha: string;
  fechaPago?: string | null;
  detalle: string;
  monto: number;
  formaPago: FormaPagoGasto;
  estadoPago: EstadoPagoGasto;
  observaciones?: string;
};

/**
 * Determina si el gasto debe generar un movimiento en Caja.
 *
 * Caja registra:
 * - efectivo
 * - transferencia
 *
 * Un gasto pendiente o a cuenta corriente no genera movimiento.
 */
function debeMoverCaja(
  formaPago: FormaPagoGasto,
  estadoPago: EstadoPagoGasto
) {
  return (
    estadoPago === 'pagado' &&
    (formaPago === 'efectivo' || formaPago === 'transferencia')
  );
}

/**
 * Obtiene todos los gastos del negocio.
 */
export async function fetchGastos(negocioId: string) {
  const { data, error } = await supabase
    .from('gastos')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

/**
 * Registra un nuevo gasto.
 */
export async function registrarGasto(
  params: RegistrarGastoParams
) {
  const {
    negocioId,
    fecha,
    fechaPago,
    detalle,
    monto,
    formaPago,
    estadoPago,
    observaciones,
  } = params;

  const movimientoCaja = debeMoverCaja(
    formaPago,
    estadoPago
  );

  const fechaMovimiento = fechaPago ?? fecha;

  const { data: gasto, error } = await supabase
    .from('gastos')
    .insert({
      negocio_id: negocioId,
      fecha,
      fecha_pago:
        estadoPago === 'pagado'
          ? fechaMovimiento
          : null,
      detalle,
      monto,
      forma_pago: formaPago,
      estado_pago: estadoPago,
      observaciones: observaciones || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (movimientoCaja) {
    const { error: movimientoError } = await supabase
      .from('movimientos_caja')
      .insert({
        negocio_id: negocioId,
        tipo: 'egreso',
        monto,
        fecha_hora: new Date(
          fechaMovimiento + 'T12:00:00'
        ).toISOString(),
        origen: 'gasto',
        ref_id: gasto.id,
        forma_pago: formaPago,
      });

    if (movimientoError) {
      await supabase
        .from('gastos')
        .delete()
        .eq('id', gasto.id);

      throw movimientoError;
    }
  }

  return gasto;
}

/**
 * Actualiza un gasto existente.
 */
export async function actualizarGasto(
  params: ActualizarGastoParams
) {
  const {
    negocioId,
    gastoId,
    fecha,
    fechaPago,
    detalle,
    monto,
    formaPago,
    estadoPago,
    observaciones,
  } = params;

  const movimientoCaja = debeMoverCaja(
    formaPago,
    estadoPago
  );

  const fechaMovimiento = fechaPago ?? fecha;

  // 1. Eliminar movimiento anterior.
  const { error: eliminarMovimientoError } =
    await supabase
      .from('movimientos_caja')
      .delete()
      .eq('origen', 'gasto')
      .eq('ref_id', gastoId);

  if (eliminarMovimientoError) {
    throw eliminarMovimientoError;
  }

  // 2. Actualizar gasto.
  const { data: gasto, error: gastoError } =
    await supabase
      .from('gastos')
      .update({
        negocio_id: negocioId,
        fecha,
        fecha_pago:
          estadoPago === 'pagado'
            ? fechaMovimiento
            : null,
        detalle,
        monto,
        forma_pago: formaPago,
        estado_pago: estadoPago,
        observaciones: observaciones || null,
      })
      .eq('id', gastoId)
      .select()
      .single();

  if (gastoError) {
    throw gastoError;
  }

  // 3. Crear nuevamente el movimiento si corresponde.
  if (movimientoCaja) {
    const { error: movimientoError } =
      await supabase
        .from('movimientos_caja')
        .insert({
          negocio_id: negocioId,
          tipo: 'egreso',
          monto,
          fecha_hora: new Date(
            fechaMovimiento + 'T12:00:00'
          ).toISOString(),
          origen: 'gasto',
          ref_id: gastoId,
          forma_pago: formaPago,
        });

    if (movimientoError) {
      throw movimientoError;
    }
  }

  return gasto;
}

/**
 * Elimina un gasto y su movimiento de Caja asociado.
 */
export async function eliminarGasto(
  gastoId: string
) {
  // 1. Eliminar movimiento de Caja.
  const { error: movimientoError } =
    await supabase
      .from('movimientos_caja')
      .delete()
      .eq('origen', 'gasto')
      .eq('ref_id', gastoId);

  if (movimientoError) {
    throw movimientoError;
  }

  // 2. Eliminar gasto.
  const { error: gastoError } =
    await supabase
      .from('gastos')
      .delete()
      .eq('id', gastoId);

  if (gastoError) {
    throw gastoError;
  }
}
