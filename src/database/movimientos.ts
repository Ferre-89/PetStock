import { getDatabase } from './schema';
import { Movimiento, TipoMovimiento } from '../types';

export async function insertMovimiento(
  productoId: number,
  tipo: TipoMovimiento,
  cantidad: number,
  nota?: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO movimientos (producto_id, tipo, cantidad, nota) VALUES (?, ?, ?, ?)`,
    productoId, tipo, cantidad, nota ?? null
  );
}

export async function getMovimientosByProducto(productoId: number): Promise<Movimiento[]> {
  const db = await getDatabase();
  return db.getAllAsync<Movimiento>(
    'SELECT * FROM movimientos WHERE producto_id = ? ORDER BY fecha DESC, id DESC',
    productoId
  );
}
