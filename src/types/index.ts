// Sara APP - Types for Water Distribution Management

export interface Cliente {
  id: string;
  numero: number;
  nombre: string;
  apellido: string;
  telefono: string;
  direccion: string;
  fechaAlta: string;
}

export interface Producto {
  id: string;
  nombre: string;
  tipo: 'bidon_6' | 'bidon_10' | 'bidon_20' | 'pack';
  formato?: 'pico' | 'dispenser';
}

export interface Promocion {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface PedidoDetalle {
  id: string;
  pedidoId: string;
  productoId: string;
  cantidad: number;
}

export interface Pedido {
  id: string;
  fecha: string;
  clienteId: string;
  estado: 'pendiente' | 'subido' | 'entregado' | 'cancelado';
  observaciones: string;
  detalles: PedidoDetalle[];
}

export interface Venta {
  id: string;
  fecha: string;
  clienteId: string;
  pedidoId?: string;
  productoId: string;
  promocionId?: string;
  precio: number;
  formaPago: 'efectivo' | 'transferencia' | 'pendiente' | 'cuenta_corriente';
  estadoPago: 'pagado' | 'pendiente';
  fechaPago?: string;
  entregamos: number;  // Cantidad de bidones entregados
  llevamos: number;    // Cantidad de bidones retirados (vacíos)
  observaciones: string;
}

// Format for saving to Google Sheets (human-readable, no IDs)
export interface VentaSheets {
  id: string;
  fecha: string;
  nombre: string;      // Client first name
  apellido: string;    // Client last name
  producto: string;    // Product name (not ID)
  promocion: string;   // Promotion name (not ID)
  precio: number;
  formaPago: string;
  estadoPago: string;
  fechaPago: string;
  entregamos: string;  // "sí" or "no" for readability, or number as string
  llevamos: string;    // "sí" or "no" for readability, or number as string
  observaciones: string;
}

export interface Gasto {
  id: string;
  fecha: string;
  detalle: string;
  monto: number;
  formaPago: 'efectivo' | 'transferencia';
  observaciones: string;
}

export interface MovimientoCaja {
  id: string;
  tipo: 'ingreso' | 'egreso';
  monto: number;
  fechaHora: string;
  origen: 'venta' | 'gasto';
  refId: string;
}

export interface CierreCaja {
  id: string;
  fecha: string;
  saldoInicial: number;
  totalIngresos: number;
  totalEgresos: number;
  saldoFinal: number;
  estado: 'abierto' | 'cerrado';
  tipoCierre?: 'normal' | 'seguridad'; // 'seguridad' for late payments after initial close
  // Apertura / cierre por fecha (resumen de ventas del día)
  horaApertura?: string;   // ISO datetime
  horaCierre?: string;     // ISO datetime
  cantidadVentas?: number;
  totalEfectivo?: number;
  totalTransferencia?: number;
  totalOtros?: number;
  totalVendido?: number;
  totalCobrado?: number;
  totalPendiente?: number;
}


export type FormaPago = 'efectivo' | 'transferencia' | 'pendiente' | 'cuenta_corriente';
export type EstadoPago = 'pagado' | 'pendiente';
export type EstadoPedido = 'pendiente' | 'subido' | 'entregado' | 'cancelado';
