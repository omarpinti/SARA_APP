export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cierres_caja: {
        Row: {
          cantidad_ventas: number | null
          created_at: string
          estado: Database["public"]["Enums"]["cierre_estado"]
          fecha: string
          hora_apertura: string | null
          hora_cierre: string | null
          id: string
          negocio_id: string
          saldo_final: number
          saldo_inicial: number
          tipo_cierre: Database["public"]["Enums"]["cierre_tipo"] | null
          total_cobrado: number | null
          total_efectivo: number | null
          total_egresos: number
          total_ingresos: number
          total_otros: number | null
          total_pendiente: number | null
          total_transferencia: number | null
          total_vendido: number | null
        }
        Insert: {
          cantidad_ventas?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["cierre_estado"]
          fecha?: string
          hora_apertura?: string | null
          hora_cierre?: string | null
          id?: string
          negocio_id: string
          saldo_final?: number
          saldo_inicial?: number
          tipo_cierre?: Database["public"]["Enums"]["cierre_tipo"] | null
          total_cobrado?: number | null
          total_efectivo?: number | null
          total_egresos?: number
          total_ingresos?: number
          total_otros?: number | null
          total_pendiente?: number | null
          total_transferencia?: number | null
          total_vendido?: number | null
        }
        Update: {
          cantidad_ventas?: number | null
          created_at?: string
          estado?: Database["public"]["Enums"]["cierre_estado"]
          fecha?: string
          hora_apertura?: string | null
          hora_cierre?: string | null
          id?: string
          negocio_id?: string
          saldo_final?: number
          saldo_inicial?: number
          tipo_cierre?: Database["public"]["Enums"]["cierre_tipo"] | null
          total_cobrado?: number | null
          total_efectivo?: number | null
          total_egresos?: number
          total_ingresos?: number
          total_otros?: number | null
          total_pendiente?: number | null
          total_transferencia?: number | null
          total_vendido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cierres_caja_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          apellido: string
          created_at: string
          direccion: string | null
          fecha_alta: string
          frecuencia_dias: number | null
          id: string
          negocio_id: string
          nombre: string
          numero: number
          telefono: string | null
        }
        Insert: {
          apellido: string
          created_at?: string
          direccion?: string | null
          fecha_alta?: string
          frecuencia_dias?: number | null
          id?: string
          negocio_id: string
          nombre: string
          numero: number
          telefono?: string | null
        }
        Update: {
          apellido?: string
          created_at?: string
          direccion?: string | null
          fecha_alta?: string
          frecuencia_dias?: number | null
          id?: string
          negocio_id?: string
          nombre?: string
          numero?: number
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      gastos: {
        Row: {
          created_at: string
          detalle: string
          estado_pago: Database["public"]["Enums"]["estado_pago"]
          fecha: string
          fecha_pago: string | null
          forma_pago: Database["public"]["Enums"]["forma_pago"]
          id: string
          monto: number
          negocio_id: string
          observaciones: string | null
        }
        Insert: {
          created_at?: string
          detalle: string
          estado_pago?: Database["public"]["Enums"]["estado_pago"]
          fecha?: string
          fecha_pago?: string | null
          forma_pago: Database["public"]["Enums"]["forma_pago"]
          id?: string
          monto: number
          negocio_id: string
          observaciones?: string | null
        }
        Update: {
          created_at?: string
          detalle?: string
          estado_pago?: Database["public"]["Enums"]["estado_pago"]
          fecha?: string
          fecha_pago?: string | null
          forma_pago?: Database["public"]["Enums"]["forma_pago"]
          id?: string
          monto?: number
          negocio_id?: string
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_caja: {
        Row: {
          created_at: string
          fecha_hora: string
          id: string
          monto: number
          negocio_id: string
          origen: Database["public"]["Enums"]["movimiento_origen"]
          ref_id: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Insert: {
          created_at?: string
          fecha_hora?: string
          id?: string
          monto: number
          negocio_id: string
          origen: Database["public"]["Enums"]["movimiento_origen"]
          ref_id?: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Update: {
          created_at?: string
          fecha_hora?: string
          id?: string
          monto?: number
          negocio_id?: string
          origen?: Database["public"]["Enums"]["movimiento_origen"]
          ref_id?: string | null
          tipo?: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      negocios: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      pedido_detalle: {
        Row: {
          cantidad: number
          id: string
          negocio_id: string
          pedido_id: string
          producto_id: string
        }
        Insert: {
          cantidad: number
          id?: string
          negocio_id: string
          pedido_id: string
          producto_id: string
        }
        Update: {
          cantidad?: number
          id?: string
          negocio_id?: string
          pedido_id?: string
          producto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_detalle_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_detalle_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_detalle_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_id: string
          created_at: string
          estado: Database["public"]["Enums"]["pedido_estado"]
          fecha: string
          id: string
          negocio_id: string
          observaciones: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          estado?: Database["public"]["Enums"]["pedido_estado"]
          fecha?: string
          id?: string
          negocio_id: string
          observaciones?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          estado?: Database["public"]["Enums"]["pedido_estado"]
          fecha?: string
          id?: string
          negocio_id?: string
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean
          created_at: string
          descuenta_stock: boolean
          id: string
          negocio_id: string
          nombre: string
          orden: number
          permite_recambio: boolean
          precio_default: number | null
          requiere_envase: boolean
          tipo: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descuenta_stock?: boolean
          id?: string
          negocio_id: string
          nombre: string
          orden?: number
          permite_recambio?: boolean
          precio_default?: number | null
          requiere_envase?: boolean
          tipo: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descuenta_stock?: boolean
          id?: string
          negocio_id?: string
          nombre?: string
          orden?: number
          permite_recambio?: boolean
          precio_default?: number | null
          requiere_envase?: boolean
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          negocio_id: string
          nombre: string | null
        }
        Insert: {
          created_at?: string
          id: string
          negocio_id: string
          nombre?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          negocio_id?: string
          nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      promocion_detalle: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          negocio_id: string
          precio_promocional: number
          producto_id: string
          promocion_id: string
        }
        Insert: {
          cantidad?: number
          created_at?: string
          id?: string
          negocio_id: string
          precio_promocional: number
          producto_id: string
          promocion_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          negocio_id?: string
          precio_promocional?: number
          producto_id?: string
          promocion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promocion_detalle_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocion_detalle_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promocion_detalle_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
        ]
      }
      promociones: {
        Row: {
          activa: boolean
          created_at: string
          descripcion: string | null
          fecha_desde: string | null
          fecha_hasta: string | null
          id: string
          negocio_id: string
          nombre: string
          tipo: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_desde?: string | null
          fecha_hasta?: string | null
          id?: string
          negocio_id: string
          nombre: string
          tipo?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_desde?: string | null
          fecha_hasta?: string | null
          id?: string
          negocio_id?: string
          nombre?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "promociones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          cantidad: number
          id: string
          negocio_id: string
          producto_id: string
          updated_at: string
        }
        Insert: {
          cantidad?: number
          id?: string
          negocio_id: string
          producto_id: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          id?: string
          negocio_id?: string
          producto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movimientos: {
        Row: {
          cantidad: number
          created_at: string
          fecha: string
          id: string
          motivo: string | null
          negocio_id: string
          producto_id: string
          tipo: Database["public"]["Enums"]["stock_mov_tipo"]
          venta_id: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          fecha?: string
          id?: string
          motivo?: string | null
          negocio_id: string
          producto_id: string
          tipo: Database["public"]["Enums"]["stock_mov_tipo"]
          venta_id?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          fecha?: string
          id?: string
          motivo?: string | null
          negocio_id?: string
          producto_id?: string
          tipo?: Database["public"]["Enums"]["stock_mov_tipo"]
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movimientos_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movimientos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movimientos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      suscripciones: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["suscripcion_estado"]
          fecha_inicio: string
          fecha_vencimiento: string | null
          id: string
          mp_subscription_id: string | null
          negocio_id: string
          plan: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["suscripcion_estado"]
          fecha_inicio?: string
          fecha_vencimiento?: string | null
          id?: string
          mp_subscription_id?: string | null
          negocio_id: string
          plan?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["suscripcion_estado"]
          fecha_inicio?: string
          fecha_vencimiento?: string | null
          id?: string
          mp_subscription_id?: string | null
          negocio_id?: string
          plan?: string
        }
        Relationships: [
          {
            foreignKeyName: "suscripciones_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      venta_detalle: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          negocio_id: string
          precio_unitario: number
          producto_id: string
          promocion_id: string | null
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          negocio_id: string
          precio_unitario: number
          producto_id: string
          promocion_id?: string | null
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          negocio_id?: string
          precio_unitario?: number
          producto_id?: string
          promocion_id?: string | null
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_detalle_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_detalle_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_detalle_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_detalle_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          cliente_id: string
          created_at: string
          entregamos: number
          estado_pago: Database["public"]["Enums"]["estado_pago"]
          fecha: string
          fecha_pago: string | null
          forma_pago: Database["public"]["Enums"]["forma_pago"]
          id: string
          llevamos: number
          negocio_id: string
          observaciones: string | null
          pedido_id: string | null
          precio: number
          producto_id: string
          promocion_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string
          entregamos?: number
          estado_pago?: Database["public"]["Enums"]["estado_pago"]
          fecha?: string
          fecha_pago?: string | null
          forma_pago: Database["public"]["Enums"]["forma_pago"]
          id?: string
          llevamos?: number
          negocio_id: string
          observaciones?: string | null
          pedido_id?: string | null
          precio: number
          producto_id: string
          promocion_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string
          entregamos?: number
          estado_pago?: Database["public"]["Enums"]["estado_pago"]
          fecha?: string
          fecha_pago?: string | null
          forma_pago?: Database["public"]["Enums"]["forma_pago"]
          id?: string
          llevamos?: number
          negocio_id?: string
          observaciones?: string | null
          pedido_id?: string | null
          precio?: number
          producto_id?: string
          promocion_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_promocion_id_fkey"
            columns: ["promocion_id"]
            isOneToOne: false
            referencedRelation: "promociones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      balance_envases: {
        Row: {
          apellido: string | null
          cliente_id: string | null
          envases_en_poder_cliente: number | null
          negocio_id: string | null
          nombre: string | null
          total_entregados: number | null
          total_retirados: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
      cuenta_corriente: {
        Row: {
          apellido: string | null
          cliente_id: string | null
          negocio_id: string | null
          nombre: string | null
          saldo_deudor: number | null
          ventas_pendientes: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_negocio_id_fkey"
            columns: ["negocio_id"]
            isOneToOne: false
            referencedRelation: "negocios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      negocio_actual: { Args: never; Returns: string }
    }
    Enums: {
      cierre_estado: "abierto" | "cerrado"
      cierre_tipo: "normal" | "seguridad"
      estado_pago: "pagado" | "pendiente"
      forma_pago:
        | "efectivo"
        | "transferencia"
        | "pendiente"
        | "cuenta_corriente"
      movimiento_origen: "venta" | "gasto"
      movimiento_tipo: "ingreso" | "egreso"
      pedido_estado: "pendiente" | "subido" | "entregado" | "cancelado"
      producto_tipo: "bidon_10" | "bidon_20" | "pack"
      stock_mov_tipo: "ingreso" | "egreso" | "ajuste"
      suscripcion_estado: "prueba" | "activo" | "vencido" | "cancelado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cierre_estado: ["abierto", "cerrado"],
      cierre_tipo: ["normal", "seguridad"],
      estado_pago: ["pagado", "pendiente"],
      forma_pago: [
        "efectivo",
        "transferencia",
        "pendiente",
        "cuenta_corriente",
      ],
      movimiento_origen: ["venta", "gasto"],
      movimiento_tipo: ["ingreso", "egreso"],
      pedido_estado: ["pendiente", "subido", "entregado", "cancelado"],
      producto_tipo: ["bidon_10", "bidon_20", "pack"],
      stock_mov_tipo: ["ingreso", "egreso", "ajuste"],
      suscripcion_estado: ["prueba", "activo", "vencido", "cancelado"],
    },
  },
} as const
