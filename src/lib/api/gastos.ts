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

export async function fetchGastos(negocioId: string) {
  const { data, error } = await supabase
    .from('gastos')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

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

  const { data: gasto, error } = await supabase
    .from('gastos')
    .insert({
      negocio_id: negocioId,
      fecha,
      fecha_pago: estadoPago === 'pagado'
        ? fechaPago ?? fecha
        : null,
      detalle,
      monto,
      forma_pago: formaPago,
      estado_pago: estadoPago,
      observaciones: observaciones || null,
    })
    .select()
    .single();

  if (error) throw error;

  if (estadoPago === 'pagado') {
    const { error: movimientoError } = await supabase
      .from('movimientos_caja')
      .insert({
        negocio_id: negocioId,
        tipo: 'egreso',
        monto,
        fecha_hora: new Date(
          `${fechaPago ?? fecha}T12:00:00`
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