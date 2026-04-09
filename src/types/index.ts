export interface Producto {
  id: number;
  nombre: string;
  marca: string;
  categoria: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  fecha_vencimiento: string | null;
  created_at: string;
}

export type TipoMovimiento = 'entrada' | 'salida' | 'ajuste';

export interface Movimiento {
  id: number;
  producto_id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  fecha: string;
  nota: string | null;
}

export interface AlertaStock {
  producto_id: number;
  producto_nombre: string;
  producto_marca: string;
  stock: number;
  stock_minimo: number;
  categoria: string;
}

export interface AlertaVencimiento {
  producto_id: number;
  producto_nombre: string;
  producto_marca: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  stock: number;
  categoria: string;
}

export type Categoria = 'comida' | 'juguetes' | 'medicamentos' | 'collares' | 'accesorios';

export interface Proveedor {
  id: number;
  nombre: string;
  telefono: string;
  email: string;
  notas: string;
  created_at: string;
}

export interface ProveedorConProductos extends Proveedor {
  cantidad_productos: number;
}

export interface ProductoProveedor {
  id: number;
  producto_id: number;
  proveedor_id: number;
  precio_costo: number;
  producto_nombre: string;
  producto_marca: string;
  producto_categoria: string;
}

export type InventarioStackParamList = {
  InventarioList: undefined;
};
