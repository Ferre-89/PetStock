import { getDatabase } from './schema';
import { AlertaStock, AlertaVencimiento } from '../types';

export function getAlertasStockBajo(): AlertaStock[] {
  const db = getDatabase();
  return db.getAllSync<AlertaStock>(
    `SELECT id as producto_id, nombre as producto_nombre, marca as producto_marca,
            categoria, stock_minimo, stock
     FROM productos
     WHERE stock <= stock_minimo
     ORDER BY stock ASC, nombre ASC`
  );
}

export function getAlertasVencimiento(): AlertaVencimiento[] {
  const db = getDatabase();
  return db.getAllSync<AlertaVencimiento>(
    `SELECT id as producto_id, nombre as producto_nombre, marca as producto_marca,
            categoria, fecha_vencimiento, stock,
            CAST(julianday(fecha_vencimiento) - julianday('now') AS INTEGER) as dias_restantes
     FROM productos
     WHERE fecha_vencimiento IS NOT NULL
       AND julianday(fecha_vencimiento) - julianday('now') <= 30
       AND stock > 0
     ORDER BY fecha_vencimiento ASC`
  );
}

export function getTotalAlertas(): number {
  const db = getDatabase();
  const stockBajo = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM productos WHERE stock <= stock_minimo'
  );
  const vencimiento = db.getFirstSync<{ count: number }>(
    `SELECT COUNT(*) as count FROM productos
     WHERE fecha_vencimiento IS NOT NULL
       AND julianday(fecha_vencimiento) - julianday('now') <= 30
       AND stock > 0`
  );
  return (stockBajo?.count ?? 0) + (vencimiento?.count ?? 0);
}
