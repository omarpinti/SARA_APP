import { supabase } from '@/integrations/supabase/client';
import type { Cliente, Pedido, Venta, Gasto, MovimientoCaja, CierreCaja, VentaSheets } from '@/types';

type SheetName = 'Clientes' | 'Pedidos' | 'Pedidos_Detalle' | 'Ventas' | 'Gastos' | 'Movimientos_Caja' | 'Cierres_Caja';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function callSheetsApi<T>(action: string, sheet: SheetName, data?: any, id?: string): Promise<ApiResponse<T>> {
  try {
    const { data: result, error } = await supabase.functions.invoke('google-sheets', {
      body: { action, sheet, data, id }
    });

    if (error) {
      console.error('Sheets API error:', error);
      return { error: error.message };
    }

    return { data: result as T };
  } catch (err) {
    console.error('Sheets API call failed:', err);
    return { error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// Clientes
export async function getClientes(): Promise<ApiResponse<Cliente[]>> {
  return callSheetsApi<Cliente[]>('read', 'Clientes');
}

export async function addCliente(cliente: Cliente): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('append', 'Clientes', cliente);
}

export async function updateCliente(id: string, cliente: Partial<Cliente>): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('update', 'Clientes', cliente, id);
}

export async function deleteCliente(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('delete', 'Clientes', undefined, id);
}

// Pedidos
export async function getPedidos(): Promise<ApiResponse<Pedido[]>> {
  const [pedidosRes, detallesRes] = await Promise.all([
    callSheetsApi<any[]>('read', 'Pedidos'),
    callSheetsApi<any[]>('read', 'Pedidos_Detalle')
  ]);

  if (pedidosRes.error) return { error: pedidosRes.error };
  if (detallesRes.error) return { error: detallesRes.error };

  const pedidos = (pedidosRes.data || []).map(p => ({
    ...p,
    detalles: (detallesRes.data || []).filter(d => d.pedidoId === p.id)
  }));

  return { data: pedidos as Pedido[] };
}

export async function addPedido(pedido: Pedido): Promise<ApiResponse<{ success: boolean }>> {
  // Add pedido
  const { detalles, ...pedidoData } = pedido;
  await callSheetsApi('append', 'Pedidos', pedidoData);
  
  // Add detalles
  for (const detalle of detalles) {
    await callSheetsApi('append', 'Pedidos_Detalle', detalle);
  }
  
  return { data: { success: true } };
}

export async function updatePedido(id: string, pedido: Partial<Pedido>): Promise<ApiResponse<{ success: boolean }>> {
  const { detalles, ...pedidoData } = pedido;
  return callSheetsApi('update', 'Pedidos', pedidoData, id);
}

export async function deletePedido(id: string): Promise<ApiResponse<{ success: boolean }>> {
  // Delete detalles first
  const detallesRes = await callSheetsApi<any[]>('read', 'Pedidos_Detalle');
  if (detallesRes.data) {
    const filtered = detallesRes.data.filter(d => d.pedidoId !== id);
    await callSheetsApi('replace', 'Pedidos_Detalle', filtered);
  }
  
  // Delete pedido
  return callSheetsApi('delete', 'Pedidos', undefined, id);
}

// Ventas
export async function getVentas(): Promise<ApiResponse<Venta[]>> {
  const result = await callSheetsApi<any[]>('read', 'Ventas');
  if (result.data) {
    // Parse numeric fields
    result.data = result.data.map(v => ({
      ...v,
      precio: parseFloat(v.precio) || 0,
      entregamos: parseInt(v.entregamos) || 0,
      llevamos: parseInt(v.llevamos) || 0,
    }));
  }
  return result as ApiResponse<Venta[]>;
}

// Add sale with human-readable data (for Google Sheets)
export async function addVentaSheets(venta: VentaSheets): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('append', 'Ventas', venta);
}

export async function addVenta(venta: Venta): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('append', 'Ventas', venta);
}

export async function updateVenta(id: string, venta: Partial<Venta>): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('update', 'Ventas', venta, id);
}

export async function deleteVenta(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('delete', 'Ventas', undefined, id);
}

// Gastos
export async function getGastos(): Promise<ApiResponse<Gasto[]>> {
  const result = await callSheetsApi<any[]>('read', 'Gastos');
  if (result.data) {
    result.data = result.data.map(g => ({
      ...g,
      monto: parseFloat(g.monto) || 0,
    }));
  }
  return result as ApiResponse<Gasto[]>;
}

export async function addGasto(gasto: Gasto): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('append', 'Gastos', gasto);
}

export async function updateGasto(id: string, gasto: Partial<Gasto>): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('update', 'Gastos', gasto, id);
}

export async function deleteGasto(id: string): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('delete', 'Gastos', undefined, id);
}

// Movimientos Caja
export async function getMovimientosCaja(): Promise<ApiResponse<MovimientoCaja[]>> {
  const result = await callSheetsApi<any[]>('read', 'Movimientos_Caja');
  if (result.data) {
    result.data = result.data.map(m => ({
      ...m,
      monto: parseFloat(m.monto) || 0,
    }));
  }
  return result as ApiResponse<MovimientoCaja[]>;
}

export async function addMovimientoCaja(movimiento: MovimientoCaja): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('append', 'Movimientos_Caja', movimiento);
}

// Cierres Caja
export async function getCierresCaja(): Promise<ApiResponse<CierreCaja[]>> {
  const result = await callSheetsApi<any[]>('read', 'Cierres_Caja');
  if (result.data) {
    const num = (...vals: any[]) => {
      for (const v of vals) {
        if (v !== undefined && v !== null && v !== '') return parseFloat(v) || 0;
      }
      return 0;
    };
    result.data = result.data.map(c => ({
      ...c,
      saldoInicial: num(c.saldoInicial),
      totalIngresos: num(c.totalIngresos),
      totalEgresos: num(c.totalEgresos),
      saldoFinal: num(c.saldoFinal),
      cantidadVentas: num(c.cantidadVentas, c['Cantidad de ventas']),
      totalEfectivo: num(c.totalEfectivo, c['Efectivo']),
      totalTransferencia: num(c.totalTransferencia, c['Transferencias']),
      totalPendiente: num(c.totalPendiente, c['Pendientes de pago']),
      totalVendido: num(c.totalVendido, c['Total vendido']),
      totalCobrado: num(c.totalCobrado, c['Total cobrado']),
    }));
  }
  return result as ApiResponse<CierreCaja[]>;
}

// Envía el cierre con claves camelCase y también con los encabezados
// legibles de la hoja Cierres_Caja del usuario.
export async function addCierreCaja(cierre: CierreCaja): Promise<ApiResponse<{ success: boolean }>> {
  const payload = {
    ...cierre,
    'Cantidad de ventas': cierre.cantidadVentas ?? 0,
    'Efectivo': cierre.totalEfectivo ?? 0,
    'Transferencias': cierre.totalTransferencia ?? 0,
    'Pendientes de pago': cierre.totalPendiente ?? 0,
    'Total vendido': cierre.totalVendido ?? 0,
    'Total cobrado': cierre.totalCobrado ?? 0,
  };
  return callSheetsApi('append', 'Cierres_Caja', payload);
}


export async function updateCierreCaja(id: string, cierre: Partial<CierreCaja>): Promise<ApiResponse<{ success: boolean }>> {
  return callSheetsApi('update', 'Cierres_Caja', cierre, id);
}

// Sync all data from Google Sheets
export async function syncAllData() {
  const [clientes, pedidos, ventas, gastos, movimientos, cierres] = await Promise.all([
    getClientes(),
    getPedidos(),
    getVentas(),
    getGastos(),
    getMovimientosCaja(),
    getCierresCaja(),
  ]);

  return {
    clientes: clientes.data || [],
    pedidos: pedidos.data || [],
    ventas: ventas.data || [],
    gastos: gastos.data || [],
    movimientosCaja: movimientos.data || [],
    cierresCaja: cierres.data || [],
    errors: [
      clientes.error,
      pedidos.error,
      ventas.error,
      gastos.error,
      movimientos.error,
      cierres.error,
    ].filter(Boolean),
  };
}
