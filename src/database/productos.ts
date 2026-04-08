import { getDatabase } from './schema';
import { Producto } from '../types';
import { insertMovimiento } from './movimientos';

export function getAllProductos(categoria?: string, busqueda?: string): Producto[] {
  const db = getDatabase();
  let query = 'SELECT * FROM productos';
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (categoria && categoria !== 'todos') {
    conditions.push('categoria = ?');
    params.push(categoria);
  }
  if (busqueda && busqueda.trim()) {
    conditions.push('(nombre LIKE ? OR marca LIKE ?)');
    const term = `%${busqueda.trim()}%`;
    params.push(term, term);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY nombre ASC';

  return db.getAllSync<Producto>(query, params);
}

export function getProductoById(id: number): Producto | null {
  const db = getDatabase();
  return db.getFirstSync<Producto>('SELECT * FROM productos WHERE id = ?', id);
}

export function insertProducto(producto: Omit<Producto, 'id' | 'created_at'>): number {
  const db = getDatabase();
  const result = db.runSync(
    `INSERT INTO productos (nombre, marca, categoria, precio, stock, stock_minimo, fecha_vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    producto.nombre, producto.marca, producto.categoria, producto.precio,
    producto.stock, producto.stock_minimo, producto.fecha_vencimiento ?? null
  );
  return result.lastInsertRowId;
}

export function updateProducto(id: number, producto: Omit<Producto, 'id' | 'created_at'>): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE productos SET nombre = ?, marca = ?, categoria = ?, precio = ?, stock = ?, stock_minimo = ?, fecha_vencimiento = ? WHERE id = ?`,
    producto.nombre, producto.marca, producto.categoria, producto.precio,
    producto.stock, producto.stock_minimo, producto.fecha_vencimiento ?? null, id
  );
}

export function setStock(id: number, nuevoStock: number): void {
  const db = getDatabase();
  const producto = db.getFirstSync<Producto>('SELECT * FROM productos WHERE id = ?', id);
  if (!producto) return;

  const diferencia = nuevoStock - producto.stock;
  if (diferencia === 0) return;

  db.runSync('UPDATE productos SET stock = ? WHERE id = ?', nuevoStock, id);
  insertMovimiento(id, 'ajuste', Math.abs(diferencia));
}

export function deleteProducto(id: number): void {
  const db = getDatabase();
  db.runSync('DELETE FROM movimientos WHERE producto_id = ?', id);
  db.runSync('DELETE FROM productos WHERE id = ?', id);
}
