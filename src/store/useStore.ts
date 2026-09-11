import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Cliente, Pedido, Venta, Gasto, MovimientoCaja, CierreCaja, VentaSheets, Producto } from '@/types';
import {
  ventasIniciales,
  gastosIniciales,
  movimientosIniciales,
  cierresIniciales,
  productos as productosMock,
  promociones,
} from '@/data/mockData';
import * as sheetsApi from '@/lib/api/googleSheets';
import * as clientesApi from '@/lib/api/clientes';
import * as pedidosApi from '@/lib/api/pedidos';
import * as productosApi from '@/lib/api/productos';
import * as gastosApi from '@/lib/api/gastos';


interface AppState {
  // Data
  clientes: Cliente[];
  pedidos: Pedido[];
  productos: Producto[];
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

  // Actions - Carga inicial desde Supabase
  fetchClientes: () => Promise<void>;
  fetchPedidos: () => Promise<void>;
  fetchProductos: () => Promise<void>;

  // Actions - Clientes
  addCliente: (cliente: Omit<Cliente, 'id' | 'numero'>) => Promise<Cliente>;
  updateCliente: (id: string, cliente: Partial<Cliente>) => Promise<void>;
  deleteCliente: (id: string) => Promise<void>;

  // Actions - Pedidos
  addPedido: (pedido: Omit<Pedido, 'id'>) => Promise<void>;
  updatePedido: (id: string, pedido: Partial<Pedido>) => Promise<void>;
  deletePedido: (id: string) => Promise<void>;
  convertirPedidoAVenta: (pedidoId: string, ventaData: Omit<Venta, 'id' | 'pedidoId'>) => void;

  // Actions - Ventas
  
  addVenta: (venta: Omit<Venta, 'id'>) => void;

  // Actions - Gastos
  addGasto: (gasto: Omit<Gasto, 'id'>) => void;
  updateGasto: (id: string, gasto: Partial<Gasto>) => void;
  deleteGasto: (id: string) => Promise<void>;

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
      clientes: [],
      pedidos: [],
      productos: [],
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
  set({
    isLoading: false,
    syncError: null,
    isOnline: true,
  });
},         
      setOnlineMode: (online) => set({ isOnline: online }),

      // Carga inicial desde Supabase
      fetchClientes: async () => {
        const clientes = await clientesApi.fetchClientes();
        set({ clientes });
      },

      fetchPedidos: async () => {
        const pedidos = await pedidosApi.fetchPedidos();
        set({ pedidos });
      },

      fetchProductos: async () => {
        const productos = await productosApi.fetchProductos();
        set({ productos });
      },

      // Clientes
  // Clientes
        addCliente: async (clienteData, negocioId) => {
         const cliente = await clientesApi.createCliente(clienteData, negocioId);

          set((state) => ({
           clientes: [...state.clientes, cliente].sort(
           (a, b) => a.numero - b.numero
           ),
          }));

            return cliente;
          },



      updateCliente: async (id, clienteData) => {
        await clientesApi.updateCliente(id, clienteData);
        set((state) => ({
          clientes: state.clientes.map((c) =>
            c.id === id ? { ...c, ...clienteData } : c
          ),
        }));
      },

      deleteCliente: async (id) => {
        await clientesApi.deleteCliente(id);
        set((state) => ({
          clientes: state.clientes.filter((c) => c.id !== id),
        }));
      },

      // Pedidos
      addPedido: async (pedidoData) => {
        const pedido = await pedidosApi.createPedido(pedidoData);
        set((state) => ({ pedidos: [pedido, ...state.pedidos] }));
      },

      updatePedido: async (id, pedidoData) => {
        await pedidosApi.updatePedido(id, pedidoData);
        set((state) => ({
          pedidos: state.pedidos.map((p) =>
            p.id === id ? { ...p, ...pedidoData } : p
          ),
        }));
      },

      deletePedido: async (id) => {
        await pedidosApi.deletePedido(id);
        set((state) => ({
          pedidos: state.pedidos.filter((p) => p.id !== id),
        }));
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
        pedidosApi.updatePedido(pedidoId, { estado: 'entregado' }).catch(console.error);
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

  const cliente = get().clientes.find(c => c.id === venta.clienteId);
  const producto = productosMock.find(p => p.id === venta.productoId);
  const promocion = venta.promocionId
    ? promociones.find(p => p.id === venta.promocionId)
    : null;

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
        const producto = productosMock.find((p) => p.id === merged.productoId);
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

      deleteGasto: async (id) => {
        await gastosApi.eliminarGasto(id);

      set((state) => ({
        gastos: state.gastos.filter((g) => g.id !== id),
        movimientos: state.movimientos.filter(
        (m) => !(m.origen === 'gasto' && m.refId === id)
    ),
  }));
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
      partialize: (state) => ({
        ventas: state.ventas,
        gastos: state.gastos,
        movimientos: state.movimientos,
        cierres: state.cierres,
      }),
    }
  )
);
