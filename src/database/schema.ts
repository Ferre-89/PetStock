import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

const DB_NAME = 'petstock.db';

let db: SQLiteDatabase | null = null;

export function getDatabase(): SQLiteDatabase {
  if (db) return db;

  db = openDatabaseSync(DB_NAME);

  db.execSync('PRAGMA journal_mode = WAL');
  db.execSync('PRAGMA foreign_keys = OFF');

  // Migrar schema viejo si existe
  const cols = db.getAllSync<{ name: string }>("PRAGMA table_info(productos)");
  if (cols.length > 0 && !cols.some(c => c.name === 'stock')) {
    db.execSync('DROP TABLE IF EXISTS movimientos');
    db.execSync('DROP TABLE IF EXISTS variantes');
    db.execSync('DROP TABLE IF EXISTS productos');
  }

  // Limpiar tablas huérfanas del schema viejo
  db.execSync('DROP TABLE IF EXISTS variantes');
  const movCols = db.getAllSync<{ name: string }>("PRAGMA table_info(movimientos)");
  if (movCols.some(c => c.name === 'variante_id')) {
    db.execSync('DROP TABLE IF EXISTS movimientos');
  }

  db.execSync('PRAGMA foreign_keys = ON');

  db.execSync(`
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      marca TEXT NOT NULL DEFAULT '',
      categoria TEXT NOT NULL DEFAULT '',
      precio REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      stock_minimo INTEGER NOT NULL DEFAULT 0,
      fecha_vencimiento TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.execSync(`
    CREATE TABLE IF NOT EXISTS movimientos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      producto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste')),
      cantidad INTEGER NOT NULL,
      fecha TEXT NOT NULL DEFAULT (datetime('now')),
      nota TEXT,
      FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
    );
  `);

  return db;
}
