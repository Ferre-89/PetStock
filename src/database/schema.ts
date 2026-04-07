import * as SQLite from 'expo-sqlite';

const DB_NAME = 'petstock.db';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    try {
      // Verificar que la conexión sigue viva
      await db.execAsync('SELECT 1');
      return db;
    } catch {
      // Conexión stale, reconectar
      db = null;
    }
  }
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await initializeDatabase(db);
  return db;
}

async function initializeDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync('PRAGMA journal_mode = WAL');
  await database.execAsync('PRAGMA foreign_keys = ON');

  // Limpiar tablas del schema viejo si existen
  await database.execAsync('DROP TABLE IF EXISTS variantes');

  // Recrear movimientos sin variante_id si tiene el schema viejo
  const tableInfo = await database.getAllAsync<{ name: string }>(
    "PRAGMA table_info(movimientos)"
  );
  const tieneVarianteId = tableInfo.some(col => col.name === 'variante_id');
  if (tieneVarianteId) {
    await database.execAsync('DROP TABLE IF EXISTS movimientos');
  }

  await database.execAsync(`
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

  await database.execAsync(`
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
}
