import { supabase } from '@/integrations/supabase/client';

export async function fetchMovimientosCajaDia(
  negocioId: string,
  fecha: Date
) {
  const desde = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate(),
    0,
    0,
    0
  );

  const hasta = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    fecha.getDate() + 1,
    0,
    0,
    0
  );

  const { data: movimientos, error } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('negocio_id', negocioId)
    .gte('fecha_hora', desde.toISOString())
    .lt('fecha_hora', hasta.toISOString())
    .order('fecha_hora', { ascending: true });

  if (error) throw error;

  return movimientos ?? [];
}

export async function fetchVentasPendientesDia(
  negocioId: string,
  fechaKey: string
) {
  const { data, error } = await supabase
    .from('ventas')
    .select('id, precio')
    .eq('negocio_id', negocioId)
    .eq('fecha', fechaKey)
    .eq('estado_pago', 'pendiente');

  if (error) throw error;

  return data || [];
}

export async function fetchMovimientosCajaMes(
  negocioId: string,
  fecha: Date
) {
  const desde = new Date(
    fecha.getFullYear(),
    fecha.getMonth(),
    1,
    0,
    0,
    0
  );

  const hasta = new Date(
    fecha.getFullYear(),
    fecha.getMonth() + 1,
    1,
    0,
    0,
    0
  );

  const { data: movimientos, error } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('negocio_id', negocioId)
    .gte('fecha_hora', desde.toISOString())
    .lt('fecha_hora', hasta.toISOString())
    .order('fecha_hora', { ascending: true });

  if (error) throw error;

  return movimientos ?? [];
}