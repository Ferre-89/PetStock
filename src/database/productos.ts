import { getDatabase } from './schema';
import { Producto } from '../types';
import { insertMovimiento } from './movimientos';

export async function getAllProductos(categoria?: string, busqueda?: string): Promise<Producto[]> {
  const db = await getDatabase();
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

  return db.getAllAsync<Producto>(query, params);
}

export async function getProductoById(id: number): Promise<Producto | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Producto>('SELECT * FROM productos WHERE id = ?', [id]);
}

export async function insertProducto(producto: Omit<Producto, 'id' | 'created_at'>): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO productos (nombre, marca, categoria, precio, stock, stock_minimo, fecha_vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    producto.nombre, producto.marca, producto.categoria, producto.precio,
    producto.stock, producto.stock_minimo, producto.fecha_vencimiento ?? null
  );
  return result.lastInsertRowId;
}

export async function updateProducto(id: number, producto: Omit<Producto, 'id' | 'created_at'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE productos SET nombre = ?, marca = ?, categoria = ?, precio = ?, stock = ?, stock_minimo = ?, fecha_vencimiento = ? WHERE id = ?`,
    producto.nombre, producto.marca, producto.categoria, producto.precio,
    producto.stock, producto.stock_minimo, producto.fecha_vencimiento ?? null, id
  );
}

export async function setStock(id: number, nuevoStock: number): Promise<void> {
  const db = await getDatabase();
  const producto = await db.getFirstAsync<Producto>('SELECT * FROM productos WHERE id = ?', [id]);
  if (!producto) return;

  const diferencia = nuevoStock - producto.stock;
  if (diferencia === 0) return;

  await db.runAsync('UPDATE productos SET stock = ? WHERE id = ?', nuevoStock, id);
  await insertMovimiento(id, 'ajuste', Math.abs(diferencia));
}

export async function deleteProducto(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM productos WHERE id = ?', [id]);
}
