import { getDatabase } from './schema';
import { Proveedor, ProveedorConProductos, ProductoProveedor } from '../types';

export function getAllProveedores(busqueda?: string): ProveedorConProductos[] {
  const db = getDatabase();
  let query = `
    SELECT p.*, COALESCE(pp.cnt, 0) as cantidad_productos
    FROM proveedores p
    LEFT JOIN (SELECT proveedor_id, COUNT(*) as cnt FROM producto_proveedor GROUP BY proveedor_id) pp
      ON pp.proveedor_id = p.id
  `;
  const params: string[] = [];

  if (busqueda && busqueda.trim()) {
    query += ' WHERE p.nombre LIKE ?';
    params.push(`%${busqueda.trim()}%`);
  }
  query += ' ORDER BY p.nombre ASC';

  return db.getAllSync<ProveedorConProductos>(query, params);
}

export function getProveedorById(id: number): Proveedor | null {
  const db = getDatabase();
  return db.getFirstSync<Proveedor>('SELECT * FROM proveedores WHERE id = ?', id);
}

export function insertProveedor(proveedor: Omit<Proveedor, 'id' | 'created_at'>): number {
  const db = getDatabase();
  const result = db.runSync(
    'INSERT INTO proveedores (nombre, telefono, email, notas) VALUES (?, ?, ?, ?)',
    proveedor.nombre, proveedor.telefono, proveedor.email, proveedor.notas
  );
  return result.lastInsertRowId;
}

export function updateProveedor(id: number, proveedor: Omit<Proveedor, 'id' | 'created_at'>): void {
  const db = getDatabase();
  db.runSync(
    'UPDATE proveedores SET nombre = ?, telefono = ?, email = ?, notas = ? WHERE id = ?',
    proveedor.nombre, proveedor.telefono, proveedor.email, proveedor.notas, id
  );
}

export function deleteProveedor(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM producto_proveedor WHERE proveedor_id = ?', id);
  db.runSync('DELETE FROM proveedores WHERE id = ?', id);
}

export function getProductosByProveedor(proveedorId: number): ProductoProveedor[] {
  const db = getDatabase();
  return db.getAllSync<ProductoProveedor>(
    `SELECT pp.*, pr.nombre as producto_nombre, pr.marca as producto_marca, pr.categoria as producto_categoria
     FROM producto_proveedor pp
     JOIN productos pr ON pr.id = pp.producto_id
     WHERE pp.proveedor_id = ?
     ORDER BY pr.nombre ASC`,
    proveedorId
  );
}

export interface ProveedorDeProducto {
  proveedor_id: number;
  proveedor_nombre: string;
  precio_costo: number;
}

export function getProveedoresByProducto(productoId: number): ProveedorDeProducto[] {
  const db = getDatabase();
  return db.getAllSync<ProveedorDeProducto>(
    `SELECT pp.proveedor_id, p.nombre as proveedor_nombre, pp.precio_costo
     FROM producto_proveedor pp
     JOIN proveedores p ON p.id = pp.proveedor_id
     WHERE pp.producto_id = ?
     ORDER BY p.nombre ASC`,
    productoId
  );
}

export function asociarProducto(proveedorId: number, productoId: number, precioCosto: number): void {
  const db = getDatabase();
  db.runSync(
    'INSERT OR REPLACE INTO producto_proveedor (producto_id, proveedor_id, precio_costo) VALUES (?, ?, ?)',
    productoId, proveedorId, precioCosto
  );
}

export function desasociarProducto(proveedorId: number, productoId: number): void {
  const db = getDatabase();
  db.runSync(
    'DELETE FROM producto_proveedor WHERE proveedor_id = ? AND producto_id = ?',
    proveedorId, productoId
  );
}
