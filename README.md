# Sara Water Flow

PROMPT PARA LOVABLE
Contexto

Crear una aplicación de gestión comercial llamada Sara APP, usada por una sola persona, con Google Sheets como único backend, orientada a la venta y distribución de bidones de agua.
La aplicación debe separar correctamente Pedidos, Ventas, Gastos, Caja y Cierres de Caja diarios, garantizando control de efectivo real y consistencia de datos.

Estructura de Datos (Google Sheets)
Sheet: Clientes

Cliente_ID (ID único)

Numero_Cliente (autogenerado)

Nombre

Apellido

Telefono

Direccion

Fecha_Alta

Sheet: Productos

Producto_ID

Nombre

Bidones de 10 Lts

Bidones de 20 Lts

Packs

Sheet: Promociones

Promocion_ID

Nombre

Pack individual

Pack dúo

Pack trío

Pack clásico (4 bidones)

Pack primera entrega

Pack segunda entrega

Finaliza pack

Sheet: Pedidos

Pedido_ID

Fecha_Pedido

Cliente_ID

Estado (pendiente / entregado / cancelado)

Observaciones

Sheet: Pedidos_Detalle

Detalle_ID

Pedido_ID

Producto_ID

Cantidad

Sheet: Ventas

Venta_ID

Fecha_Venta

Cliente_ID

Pedido_ID (opcional)

Producto_ID

Promocion_ID

Precio

Forma_Pago (efectivo / transferencia / pendiente / cuenta corriente)

Estado_Pago (pagado / pendiente)

Fecha_De_Pago

Entregamos (sí/no)

Llevamos (sí/no)

Observaciones

Sheet: Gastos

Gasto_ID

Fecha

Detalle

Monto

Forma_Pago (efectivo / transferencia)

Observaciones

Sheet: Movimientos_Caja

Movimiento_ID

Tipo (Ingreso / Egreso)

Monto

Fecha_Hora

Origen (Venta / Gasto)

Ref_ID

Sheet: Cierres_Caja

Cierre_ID

Fecha

Saldo_Inicial

Total_Ingresos

Total_Egresos

Saldo_Final

Estado (abierto / cerrado)

Reglas de Negocio (OBLIGATORIAS)

Pedidos

No impactan ventas ni caja

Pueden convertirse en venta una sola vez

Ventas

Solo afectan caja si:

Forma_Pago = efectivo

Estado_Pago = pagado

En ese caso generar Movimiento_Caja tipo Ingreso

Gastos

Solo afectan caja si:

Forma_Pago = efectivo

Generan Movimiento_Caja tipo Egreso

Caja

No se guarda saldo manual

Todo se calcula desde Movimientos_Caja

Cierre de Caja

Un solo cierre por día

Saldo_Final =
Saldo_Inicial + Total_Ingresos − Total_Egresos

Una vez cerrado:

no se pueden editar ventas ni gastos del día

Pantallas requeridas

Clientes

Pedidos (con detalle de productos y cantidades)

Ventas (manual o desde pedido)

Gastos

Caja del Día (resumen automático)

Cierre de Caja (botón cerrar + bloqueo)

Criterios de Calidad

Uso de selects, no texto libre

Validaciones automáticas

Cálculos invisibles al usuario

Datos consistentes

Diseño preparado para migrar a backend real en el futuro

Resultado esperado

Una aplicación funcional en Lovable que controle correctamente:

pedidos

ventas

gastos

efectivo diario

cierres de caja

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://saraapp.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/50689aba-86cb-4b63-84d2-49a04860e11c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
