import { supabase } from '@/integrations/supabase/client';

export interface ResumenCierre {
  cantidadVentas: number;
  totalEfectivo: number;
  totalTransferencia: number;
  totalOtros: number;
  totalPendiente: number;
  totalVendido: number;
  totalCobrado: number;
}

// Trae las ventas "efectivas" de una fecha: si la venta tiene fecha de pago,
// cuenta en la fecha de pago; si no, cuenta en su fecha de carga.
export async function fetchVentasEfectivasDia(negocioId: string, fechaStr: string) {
  const { data, error } = await supabase
    .from('ventas')
    .select('id, precio, estado_pago, forma_pago, fecha, fecha_pago')
    .eq('negocio_id', negocioId)
    .or(`fecha_pago.eq.${fechaStr},and(fecha_pago.is.null,fecha.eq.${fechaStr})`);

  if (error) throw error;
  return data || [];
}

export async function fetchCierrePorFecha(negocioId: string, fechaStr: string) {
  const { data, error } = await supabase
    .from('cierres_caja')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('fecha', fechaStr)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchHistorialCierres(negocioId: string) {
  const { data, error } = await supabase
    .from('cierres_caja')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function abrirCajaDia(negocioId: string, fechaStr: string) {
  const { data, error } = await supabase
    .from('cierres_caja')
    .insert({
      negocio_id: negocioId,
      fecha: fechaStr,
      estado: 'abierto',
      hora_apertura: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cerrarCajaDia(cierreId: string, resumen: ResumenCierre) {
  const { data, error } = await supabase
    .from('cierres_caja')
    .update({
      estado: 'cerrado',
      hora_cierre: new Date().toISOString(),
      cantidad_ventas: resumen.cantidadVentas,
      total_efectivo: resumen.totalEfectivo,
      total_transferencia: resumen.totalTransferencia,
      total_otros: resumen.totalOtros,
      total_pendiente: resumen.totalPendiente,
      total_vendido: resumen.totalVendido,
      total_cobrado: resumen.totalCobrado,
    })
    .eq('id', cierreId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function reabrirCajaDia(cierreId: string) {
  const { data, error } = await supabase
    .from('cierres_caja')
    .update({ estado: 'abierto', hora_cierre: null })
    .eq('id', cierreId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function abrirTodasLasCajas(negocioId: string) {
  const { error } = await supabase
    .from('cierres_caja')
    .update({ estado: 'abierto', hora_cierre: null })
    .eq('negocio_id', negocioId)
    .eq('estado', 'cerrado');

  if (error) throw error;
}
