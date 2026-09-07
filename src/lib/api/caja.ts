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

  if (!movimientos || movimientos.length === 0) {
    return [];
  }

  const resultado = await Promise.all(
    movimientos.map(async (movimiento) => {
      if (movimiento.origen === 'venta') {
        const { data: venta, error: ventaError } = await supabase
          .from('ventas')
          .select('forma_pago')
          .eq('id', movimiento.ref_id)
          .single();

        if (ventaError) throw ventaError;

        return {
          ...movimiento,
          forma_pago: venta?.forma_pago ?? null,
        };
      }

      if (movimiento.origen === 'gasto') {
        const { data: gasto, error: gastoError } = await supabase
          .from('gastos')
          .select('forma_pago')
          .eq('id', movimiento.ref_id)
          .single();

        if (gastoError) throw gastoError;

        return {
          ...movimiento,
          forma_pago: gasto?.forma_pago ?? null,
        };
      }

      return {
        ...movimiento,
        forma_pago: null,
      };
    })
  );

  return resultado;
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

  if (!movimientos || movimientos.length === 0) {
    return [];
  }

  const resultado = await Promise.all(
    movimientos.map(async (movimiento) => {
      if (movimiento.origen === 'venta') {
        const { data: venta, error: ventaError } = await supabase
          .from('ventas')
          .select('forma_pago')
          .eq('id', movimiento.ref_id)
          .single();

        if (ventaError) throw ventaError;

        return {
          ...movimiento,
          forma_pago: venta?.forma_pago ?? null,
        };
      }

      if (movimiento.origen === 'gasto') {
        const { data: gasto, error: gastoError } = await supabase
          .from('gastos')
          .select('forma_pago')
          .eq('id', movimiento.ref_id)
          .single();

        if (gastoError) throw gastoError;

        return {
          ...movimiento,
          forma_pago: gasto?.forma_pago ?? null,
        };
      }

      return {
        ...movimiento,
        forma_pago: null,
      };
    })
  );

  return resultado;
}