import { getDatabase } from './schema';
import { Movimiento, TipoMovimiento } from '../types';

export function insertMovimiento(
  productoId: number,
  tipo: TipoMovimiento,
  cantidad: number,
  nota?: string
): void {
  const db = getDatabase();
  db.runSync(
    `INSERT INTO movimientos (producto_id, tipo, cantidad, nota) VALUES (?, ?, ?, ?)`,
    productoId, tipo, cantidad, nota ?? null
  );
}

export function getMovimientosByProducto(productoId: number): Movimiento[] {
  const db = getDatabase();
  return db.getAllSync<Movimiento>(
    'SELECT * FROM movimientos WHERE producto_id = ? ORDER BY fecha DESC, id DESC',
    productoId
  );
}
