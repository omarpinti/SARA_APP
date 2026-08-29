import { Cliente, Producto, Promocion, Pedido, Venta, Gasto, MovimientoCaja, CierreCaja } from '@/types';

export const productos: Producto[] = [
  { id: 'prod_1', nombre: 'Bidón 10 Lts', tipo: 'bidon_10' },
  { id: 'prod_2', nombre: 'Bidón 20 Lts', tipo: 'bidon_20' },
  { id: 'prod_3', nombre: 'Pack Agua', tipo: 'pack' },
];

export const promociones: Promocion[] = [
  { id: 'promo_1', nombre: 'Pack Individual', descripcion: '1 bidón con descuento' },
  { id: 'promo_2', nombre: 'Pack Dúo', descripcion: '2 bidones' },
  { id: 'promo_3', nombre: 'Pack Trío', descripcion: '3 bidones' },
  { id: 'promo_4', nombre: 'Pack Clásico', descripcion: '4 bidones' },
  { id: 'promo_5', nombre: 'Pack Primera Entrega', descripcion: 'Primera entrega con dispensador' },
  { id: 'promo_6', nombre: 'Pack Segunda Entrega', descripcion: 'Segunda entrega' },
  { id: 'promo_7', nombre: 'Finaliza Pack', descripcion: 'Última entrega del pack' },
];

export const clientesIniciales: Cliente[] = [
  {
    id: 'cli_1',
    numero: 1,
    nombre: 'María',
    apellido: 'González',
    telefono: '11-2345-6789',
    direccion: 'Av. Rivadavia 1234, CABA',
    fechaAlta: '2024-01-15',
  },
  {
    id: 'cli_2',
    numero: 2,
    nombre: 'Carlos',
    apellido: 'Rodríguez',
    telefono: '11-3456-7890',
    direccion: 'Calle Florida 567, CABA',
    fechaAlta: '2024-02-20',
  },
  {
    id: 'cli_3',
    numero: 3,
    nombre: 'Ana',
    apellido: 'Martínez',
    telefono: '11-4567-8901',
    direccion: 'Av. Corrientes 890, CABA',
    fechaAlta: '2024-03-10',
  },
];

export const pedidosIniciales: Pedido[] = [
  {
    id: 'ped_1',
    fecha: new Date().toISOString().split('T')[0],
    clienteId: 'cli_1',
    estado: 'pendiente',
    observaciones: 'Entregar por la mañana',
    detalles: [
      { id: 'det_1', pedidoId: 'ped_1', productoId: 'prod_2', cantidad: 2 },
    ],
  },
  {
    id: 'ped_2',
    fecha: new Date().toISOString().split('T')[0],
    clienteId: 'cli_2',
    estado: 'pendiente',
    observaciones: '',
    detalles: [
      { id: 'det_2', pedidoId: 'ped_2', productoId: 'prod_1', cantidad: 3 },
      { id: 'det_3', pedidoId: 'ped_2', productoId: 'prod_2', cantidad: 1 },
    ],
  },
];

export const ventasIniciales: Venta[] = [
  {
    id: 'ven_1',
    fecha: new Date().toISOString().split('T')[0],
    clienteId: 'cli_3',
    productoId: 'prod_2',
    precio: 2500,
    formaPago: 'efectivo',
    estadoPago: 'pagado',
    fechaPago: new Date().toISOString().split('T')[0],
    entregamos: 2,
    llevamos: 1,
    observaciones: '',
  },
];

export const gastosIniciales: Gasto[] = [
  {
    id: 'gas_1',
    fecha: new Date().toISOString().split('T')[0],
    detalle: 'Combustible',
    monto: 5000,
    formaPago: 'efectivo',
    observaciones: 'Carga completa',
  },
];

export const movimientosIniciales: MovimientoCaja[] = [
  {
    id: 'mov_1',
    tipo: 'ingreso',
    monto: 2500,
    fechaHora: new Date().toISOString(),
    origen: 'venta',
    refId: 'ven_1',
  },
  {
    id: 'mov_2',
    tipo: 'egreso',
    monto: 5000,
    fechaHora: new Date().toISOString(),
    origen: 'gasto',
    refId: 'gas_1',
  },
];

export const cierresIniciales: CierreCaja[] = [];
