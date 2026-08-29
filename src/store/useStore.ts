import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cliente, Pedido, Venta, Gasto, MovimientoCaja, CierreCaja, VentaSheets } from '@/types';
import {
  clientesIniciales,
  pedidosIniciales,
  ventasIniciales,
  gastosIniciales,
  movimientosIniciales,
  cierresIniciales,
  productos,
  promociones,
} from '@/data/mockData';
import * as sheetsApi from '@/lib/api/googleSheets';

interface AppState {
  // Data
  clientes: Cliente[];
  pedidos: Pedido[];
  ventas: Venta[];
  gastos: Gasto[];
  movimientos: MovimientoCaja[];
  cierres: CierreCaja[];

  // Sync state
  isLoading: boolean;
  syncError: string | null;
  isOnline: boolean;

  // Sync actions
  syncFromSheets: () => Promise<void>;
  setOnlineMode: (online: boolean) => void;

  // Actions - Clientes
  addCliente: (cliente: Omit<Cliente, 'id' | 'numero'>) => void;
  updateCliente: (id: string, cliente: Partial<Cliente>) => void;
  deleteCliente: (id: string) => void;

  // Actions - Pedidos
  addPedido: (pedido: Omit<Pedido, 'id'>) => void;
  updatePedido: (id: string, pedido: Partial<Pedido>) => void;
  deletePedido: (id: string) => void;
  convertirPedidoAVenta: (pedidoId: string, ventaData: Omit<Venta, 'id' | 'pedidoId'>) => void;

  // Actions - Ventas
  addVenta: (venta: Omit<Venta, 'id'>) => void;
  updateVenta: (id: string, venta: Partial<Venta>) => void;
  deleteVenta: (id: string) => void;

  // Actions - Gastos
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
  updateGasto: (id: string, gasto: Partial<Gasto>) => void;
  deleteGasto: (id: string) => void;

  // Actions - Caja
  cerrarCaja: (fecha: string, saldoInicial: number) => void;
  cierreSeguridadCaja: (fecha: string) => void; // Security close for late payments
  abrirCaja: (fecha: string) => void;
  abrirTodasLasCajas: () => void;
  abrirCajaDia: (fecha: string) => void;
  cerrarCajaDia: (fecha: string, resumen: Partial<CierreCaja>) => void;


  // Helpers
  getClienteById: (id: string) => Cliente | undefined;
  getPedidoById: (id: string) => Pedido | undefined;
  isCajaCerrada: (fecha: string) => boolean;
  getCierreByFecha: (fecha: string) => CierreCaja | undefined;
}

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clientes: clientesIniciales,
      pedidos: pedidosIniciales,
      ventas: ventasIniciales,
      gastos: gastosIniciales,
      movimientos: movimientosIniciales,
      cierres: cierresIniciales,

      // Sync state
      isLoading: false,
      syncError: null,
      isOnline: false,

      // Sync from Google Sheets
      syncFromSheets: async () => {
        set({ isLoading: true, syncError: null });
        try {
          const data = await sheetsApi.syncAllData();
          
          if (data.errors.length > 0) {
            console.warn('Sync warnings:', data.errors);
          }

          // Map ventas from Sheets (human-readable) back to Venta[] using IDs.
          const clientesData = data.clientes.length > 0 ? data.clientes : get().clientes;
          const norm = (s: any) => String(s ?? '').trim().toLowerCase();
          const ventasMapped: Venta[] = (data.ventas as any[])
            .filter((v: any) => v.id && (v.nombre || v.apellido))
            .map((v: any) => {
              const cliente = clientesData.find(
                (c) => norm(c.nombre) === norm(v.nombre) && norm(c.apellido) === norm(v.apellido)
              );
              const producto = productos.find((p) => norm(p.nombre) === norm(v.producto));
              const promocion = v.promocion
                ? promociones.find((p) => norm(p.nombre) === norm(v.promocion))
                : undefined;
              return {
                id: v.id,
                fecha: v.fecha,
                clienteId: cliente?.id || '',
                productoId: producto?.id || '',
                promocionId: promocion?.id,
                precio: Number(v.precio) || 0,
                formaPago: v.formaPago,
                estadoPago: v.estadoPago,
                fechaPago: v.fechaPago || undefined,
                entregamos: Number(v.entregamos) || 0,
                llevamos: Number(v.llevamos) || 0,
                observaciones: v.observaciones || '',
              } as Venta;
            });

          if (data.clientes.length > 0 || data.pedidos.length > 0 || ventasMapped.length > 0) {
            set({
              clientes: clientesData,
              pedidos: data.pedidos.length > 0 ? data.pedidos : get().pedidos,
              ventas: ventasMapped.length > 0 ? ventasMapped : get().ventas,
              gastos: data.gastos.length > 0 ? data.gastos : get().gastos,
              movimientos: data.movimientosCaja.length > 0 ? data.movimientosCaja : get().movimientos,
              cierres: data.cierresCaja.length > 0 ? data.cierresCaja : get().cierres,
              isOnline: true,
            });
          } else {
            set({ isOnline: true });
          }

          set({ isLoading: false });
        } catch (error) {
          console.error('Sync failed:', error);
          set({ 
            isLoading: false, 
            syncError: error instanceof Error ? error.message : 'Error de sincronización',
            isOnline: false,
          });
        }
      },


      setOnlineMode: (online) => set({ isOnline: online }),

      // Clientes
      addCliente: async (clienteData) => {
        const maxNumero = Math.max(0, ...get().clientes.map((c) => c.numero));
        const cliente: Cliente = {
          ...clienteData,
          id: generateId(),
          numero: maxNumero + 1,
        };
        set((state) => ({ clientes: [...state.clientes, cliente] }));

        // Always sync to Google Sheets
        sheetsApi.addCliente(cliente).catch(console.error);
      },

      updateCliente: (id, clienteData) => {
        set((state) => ({
          clientes: state.clientes.map((c) =>
            c.id === id ? { ...c, ...clienteData } : c
          ),
        }));

        sheetsApi.updateCliente(id, clienteData).catch(console.error);
      },

      deleteCliente: (id) => {
        set((state) => ({
          clientes: state.clientes.filter((c) => c.id !== id),
        }));

        sheetsApi.deleteCliente(id).catch(console.error);
      },

      // Pedidos
      addPedido: (pedidoData) => {
        const pedido: Pedido = { ...pedidoData, id: generateId() };
        set((state) => ({ pedidos: [...state.pedidos, pedido] }));

        sheetsApi.addPedido(pedido).catch(console.error);
      },

      updatePedido: (id, pedidoData) => {
        set((state) => ({
          pedidos: state.pedidos.map((p) =>
            p.id === id ? { ...p, ...pedidoData } : p
          ),
        }));

        sheetsApi.updatePedido(id, pedidoData).catch(console.error);
      },

      deletePedido: (id) => {
        set((state) => ({
          pedidos: state.pedidos.filter((p) => p.id !== id),
        }));

        sheetsApi.deletePedido(id).catch(console.error);
      },

      convertirPedidoAVenta: (pedidoId, ventaData) => {
        const venta: Venta = {
          ...ventaData,
          id: generateId(),
          pedidoId,
        };

        const movimiento: MovimientoCaja | null = 
          (venta.formaPago === 'efectivo' && venta.estadoPago === 'pagado') 
            ? {
                id: generateId(),
                tipo: 'ingreso',
                monto: venta.precio,
                fechaHora: new Date().toISOString(),
                origen: 'venta',
                refId: venta.id,
              }
            : null;

        set((state) => ({
          ventas: [...state.ventas, venta],
          pedidos: state.pedidos.map((p) =>
            p.id === pedidoId ? { ...p, estado: 'entregado' as const } : p
          ),
          movimientos: movimiento 
            ? [...state.movimientos, movimiento]
            : state.movimientos,
        }));

        sheetsApi.addVenta(venta).catch(console.error);
        sheetsApi.updatePedido(pedidoId, { estado: 'entregado' }).catch(console.error);
        if (movimiento) {
          sheetsApi.addMovimientoCaja(movimiento).catch(console.error);
        }
      },

      // Ventas
      addVenta: (ventaData) => {
        const venta: Venta = { ...ventaData, id: generateId() };

        const movimiento: MovimientoCaja | null = 
          (venta.formaPago === 'efectivo' && venta.estadoPago === 'pagado') 
            ? {
                id: generateId(),
                tipo: 'ingreso',
                monto: venta.precio,
                fechaHora: new Date().toISOString(),
                origen: 'venta',
                refId: venta.id,
              }
            : null;

        set((state) => ({
          ventas: [...state.ventas, venta],
          movimientos: movimiento 
            ? [...state.movimientos, movimiento]
            : state.movimientos,
        }));

        // Convert to human-readable format for Google Sheets
        const cliente = get().clientes.find(c => c.id === venta.clienteId);
        const producto = productos.find(p => p.id === venta.productoId);
        const promocion = venta.promocionId ? promociones.find(p => p.id === venta.promocionId) : null;

        const ventaSheets: VentaSheets = {
          id: venta.id,
          fecha: venta.fecha,
          nombre: cliente?.nombre || '',
          apellido: cliente?.apellido || '',
          producto: producto?.nombre || '',
          promocion: promocion?.nombre || '',
          precio: venta.precio,
          formaPago: venta.formaPago,
          estadoPago: venta.estadoPago,
          fechaPago: venta.fechaPago || '',
          entregamos: venta.entregamos > 0 ? String(venta.entregamos) : '',
          llevamos: venta.llevamos > 0 ? String(venta.llevamos) : '',
          observaciones: venta.observaciones,
        };

        sheetsApi.addVentaSheets(ventaSheets).catch(console.error);
        if (movimiento) {
          sheetsApi.addMovimientoCaja(movimiento).catch(console.error);
        }
      },

      updateVenta: (id, ventaData) => {
        set((state) => ({
          ventas: state.ventas.map((v) =>
            v.id === id ? { ...v, ...ventaData } : v
          ),
        }));

        // Build a human-readable partial payload matching Sheets columns.
        const merged = get().ventas.find((v) => v.id === id);
        if (!merged) return;
        const cliente = get().clientes.find((c) => c.id === merged.clienteId);
        const producto = productos.find((p) => p.id === merged.productoId);
        const promocion = merged.promocionId ? promociones.find((p) => p.id === merged.promocionId) : null;

        const sheetsPayload: Partial<VentaSheets> = {
          fecha: merged.fecha,
          nombre: cliente?.nombre || '',
          apellido: cliente?.apellido || '',
          producto: producto?.nombre || '',
          promocion: promocion?.nombre || '',
          precio: merged.precio,
          formaPago: merged.formaPago,
          estadoPago: merged.estadoPago,
          fechaPago: merged.fechaPago || '',
          entregamos: merged.entregamos > 0 ? String(merged.entregamos) : '',
          llevamos: merged.llevamos > 0 ? String(merged.llevamos) : '',
          observaciones: merged.observaciones || '',
        };

        sheetsApi.updateVenta(id, sheetsPayload as any).catch(console.error);
      },


      deleteVenta: (id) => {
        set((state) => ({
          ventas: state.ventas.filter((v) => v.id !== id),
          movimientos: state.movimientos.filter(
            (m) => !(m.origen === 'venta' && m.refId === id)
          ),
        }));

        sheetsApi.deleteVenta(id).catch(console.error);
      },

      // Gastos
      addGasto: (gastoData) => {
        const gasto: Gasto = { ...gastoData, id: generateId() };

        const movimiento: MovimientoCaja | null = 
          (gasto.formaPago === 'efectivo') 
            ? {
                id: generateId(),
                tipo: 'egreso',
                monto: gasto.monto,
                fechaHora: new Date().toISOString(),
                origen: 'gasto',
                refId: gasto.id,
              }
            : null;

        set((state) => ({
          gastos: [...state.gastos, gasto],
          movimientos: movimiento 
            ? [...state.movimientos, movimiento]
            : state.movimientos,
        }));

        sheetsApi.addGasto(gasto).catch(console.error);
        if (movimiento) {
          sheetsApi.addMovimientoCaja(movimiento).catch(console.error);
        }
      },

      updateGasto: (id, gastoData) => {
        set((state) => ({
          gastos: state.gastos.map((g) =>
            g.id === id ? { ...g, ...gastoData } : g
          ),
        }));

        sheetsApi.updateGasto(id, gastoData).catch(console.error);
      },

      deleteGasto: (id) => {
        set((state) => ({
          gastos: state.gastos.filter((g) => g.id !== id),
          movimientos: state.movimientos.filter(
            (m) => !(m.origen === 'gasto' && m.refId === id)
          ),
        }));

        sheetsApi.deleteGasto(id).catch(console.error);
      },

      // Caja
      cerrarCaja: (fecha, saldoInicial) => {
        const movimientosDelDia = get().movimientos.filter(
          (m) => m.fechaHora.startsWith(fecha)
        );

        const totalIngresos = movimientosDelDia
          .filter((m) => m.tipo === 'ingreso')
          .reduce((sum, m) => sum + m.monto, 0);

        const totalEgresos = movimientosDelDia
          .filter((m) => m.tipo === 'egreso')
          .reduce((sum, m) => sum + m.monto, 0);

        const cierre: CierreCaja = {
          id: generateId(),
          fecha,
          saldoInicial,
          totalIngresos,
          totalEgresos,
          saldoFinal: saldoInicial + totalIngresos - totalEgresos,
          estado: 'cerrado',
          tipoCierre: 'normal',
        };

        set((state) => ({ cierres: [...state.cierres, cierre] }));

        sheetsApi.addCierreCaja(cierre).catch(console.error);
      },

      // Cierre de Seguridad - for late payments after initial close
      cierreSeguridadCaja: (fecha) => {
        const cierreExistente = get().cierres.find(c => c.fecha === fecha && c.estado === 'cerrado');
        if (!cierreExistente) {
          console.error('No existe cierre para esta fecha');
          return;
        }

        // Recalculate totals including new movements
        const movimientosDelDia = get().movimientos.filter(
          (m) => m.fechaHora.startsWith(fecha)
        );

        const totalIngresos = movimientosDelDia
          .filter((m) => m.tipo === 'ingreso')
          .reduce((sum, m) => sum + m.monto, 0);

        const totalEgresos = movimientosDelDia
          .filter((m) => m.tipo === 'egreso')
          .reduce((sum, m) => sum + m.monto, 0);

        const nuevoSaldoFinal = cierreExistente.saldoInicial + totalIngresos - totalEgresos;

        // Update the existing close
        set((state) => ({
          cierres: state.cierres.map(c => 
            c.id === cierreExistente.id 
              ? { 
                  ...c, 
                  totalIngresos, 
                  totalEgresos, 
                  saldoFinal: nuevoSaldoFinal,
                  tipoCierre: 'seguridad' as const,
                } 
              : c
          ),
        }));

        sheetsApi.updateCierreCaja(cierreExistente.id, {
          totalIngresos,
          totalEgresos,
          saldoFinal: nuevoSaldoFinal,
          tipoCierre: 'seguridad',
        }).catch(console.error);
      },

      // Abrir Caja - reopen a closed day
      abrirCaja: (fecha) => {
        set((state) => ({
          cierres: state.cierres.filter(c => c.fecha !== fecha),
        }));
      },

      abrirTodasLasCajas: () => {
        set({ cierres: [] });
      },

      // Apertura de caja por fecha (registro con hora de apertura)
      abrirCajaDia: (fecha) => {
        const existente = get().cierres.find((c) => c.fecha === fecha);
        if (existente && existente.estado === 'abierto') return;

        const cierre: CierreCaja = {
          id: generateId(),
          fecha,
          saldoInicial: 0,
          totalIngresos: 0,
          totalEgresos: 0,
          saldoFinal: 0,
          estado: 'abierto',
          horaApertura: new Date().toISOString(),
        };

        set((state) => ({
          cierres: [...state.cierres.filter((c) => c.fecha !== fecha), cierre],
        }));
      },

      // Cierre de caja por fecha usando el resumen de ventas del día
      cerrarCajaDia: (fecha, resumen) => {
        const existente = get().cierres.find((c) => c.fecha === fecha);
        if (existente?.estado === 'cerrado') return; // no duplicar cierres

        const cierre: CierreCaja = {
          id: existente?.id || generateId(),
          fecha,
          saldoInicial: existente?.saldoInicial || 0,
          totalIngresos: resumen.totalCobrado || 0,
          totalEgresos: 0,
          saldoFinal: resumen.totalCobrado || 0,
          estado: 'cerrado',
          tipoCierre: 'normal',
          horaApertura: existente?.horaApertura,
          horaCierre: new Date().toISOString(),
          ...resumen,
        };

        set((state) => ({
          cierres: [...state.cierres.filter((c) => c.fecha !== fecha), cierre],
        }));

        sheetsApi.addCierreCaja(cierre).catch(console.error);
      },


      // Helpers
      getClienteById: (id) => get().clientes.find((c) => c.id === id),
      getPedidoById: (id) => get().pedidos.find((p) => p.id === id),
      isCajaCerrada: (fecha) =>
        get().cierres.some((c) => c.fecha === fecha && c.estado === 'cerrado'),
      getCierreByFecha: (fecha) => 
        get().cierres.find((c) => c.fecha === fecha),
    }),
    {
      name: 'sara-app-storage',
    }
  )
);
