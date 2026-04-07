# PetStock - Documentación Técnica

App de gestión de inventario para pet shop.

## Stack

- React Native 0.81 + Expo SDK 54 (TypeScript)
- expo-sqlite 16 (SQLite local)
- expo-file-system + expo-sharing (exportación)
- React Navigation 7 (bottom tabs + native stack)
- @expo/vector-icons (Ionicons)

## Estructura de Carpetas

```
/src
  /screens/           — Pantallas
    InventarioScreen    — Topbar blanca, grid 2 columnas, chips categoría, FAB, ProductoModal
    AlertasScreen       — Topbar blanca, secciones stock bajo + vencimientos
    ExportarScreen      — (placeholder)
    ConfigScreen        — (placeholder)
  /components/        — Componentes reutilizables
    Toast               — Toast animado (Animated.View), aparece abajo, 2s, sin librerías externas
    ProductoModal       — Modal unificado agregar/editar. Layout: nombre, marca, categoría (chips), precio+stock (fila), stock mínimo+vencimiento (fila). Inputs borderRadius 12. Vencimiento solo editable si categoría=comida, sino "N/A". Botón eliminar rojo en modo edición con modal de confirmación custom (no Alert nativo).
  /constants/         — Constantes (categorías, colores)
  /database/          — Lógica SQLite
    schema.ts           — Inicialización DB y tablas (PRAGMAs separados)
    productos.ts        — CRUD (getAllProductos, getProductoById, insertProducto, updateProducto, setStock, deleteProducto)
    movimientos.ts      — Queries movimientos (insertMovimiento, getMovimientosByProducto) — sin pantalla visible, solo registro en DB
    alertas.ts          — Queries alertas (getAlertasStockBajo, getAlertasVencimiento, getTotalAlertas)
  /navigation/        — Navegadores
    AppNavigator        — Bottom tabs (4 tabs)
    InventarioStack     — Stack: solo InventarioList
  /types/             — Tipos TypeScript
```

## Navegación

Bottom tabs con 4 tabs:
1. **Inventario** — Lista de productos. Todo el ABM via ProductoModal.
2. **Alertas** — Stock bajo y vencimientos próximos (badge dinámico en tab)
3. **Exportar** — (placeholder)
4. **Config** — (placeholder)

Flujo principal:
- Tocar card → abre ProductoModal en modo edición
- Tocar lápiz ✏️ en card → abre ProductoModal en modo edición
- FAB (+) → abre ProductoModal en modo agregar

## Schema SQLite

Base de datos: `petstock.db`

```sql
productos (id, nombre, marca, categoria, precio, stock, stock_minimo, fecha_vencimiento, created_at)
movimientos (id, producto_id, tipo[entrada|salida|ajuste], cantidad, fecha, nota)
```

- Sin tabla de variantes (decisión MVP)
- Sin pantalla de movimientos (tabla existe para registro, sin UI)
- PRAGMAs separados (journal_mode WAL, foreign_keys ON)
- ON DELETE CASCADE en FK de movimientos

## Colores

| Uso | Color |
|-----|-------|
| Fondo topbar Inventario/Alertas | `#fff` (blanco) |
| Fondo bottom nav | `#1a1f2e` |
| Acento verde | `#1d9e75` |
| Fondo pantalla | `#f4f5f7` |
| Alerta roja | `#e24b4a` |
| Stock bajo | `#f0a500` |

### Colores de categorías

| Categoría | Color | Emoji |
|-----------|-------|-------|
| Todos | `#e1f5ee` | 🐾 |
| Comida | `#faeeda` | 🥩 |
| Juguetes | `#eeedfe` | 🎾 |
| Medicamentos | `#faece7` | 💊 |
| Collares | `#fbeaf0` | 🦮 |
| Accesorios | `#e6f1fb` | ✨ |

## Lógica de Stock

- `stock`: campo directo en la tabla productos
- **OK**: stock > stock_minimo → badge verde
- **Bajo**: 0 < stock <= stock_minimo → badge amarillo
- **Crítico**: stock <= 0 → badge rojo
- Fecha de vencimiento: solo editable si categoría = comida (TextInput con máscara DD/MM/AAAA)
- `setStock(id, nuevoStock)` calcula diferencia y registra movimiento "ajuste" automáticamente

## Lógica de Alertas

- **Stock bajo**: producto con `stock <= stock_minimo`
- **Próximo a vencer**: producto con `fecha_vencimiento` dentro de 30 días y stock > 0
- **Badge topbar**: total alertas vía `getTotalAlertas()`, actualiza en cada focus
- **Badge tab**: `tabBarBadge` dinámico vía `screenListeners.state`

## Decisiones de Arquitectura

- **Sin variantes (MVP)**: Stock directo en producto
- **Sin pantalla de detalle ni de agregar**: Todo vía ProductoModal unificado
- **Sin pantalla de movimientos**: Tabla existe para auditoría, sin UI por ahora
- **ProductoModal unificado**: productoId=null → agregar, number → editar. Eliminar con modal de confirmación custom. `onSaved(action)` retorna `'created' | 'updated' | 'deleted'` para que el parent muestre toasts
- **Toasts de feedback**: Verde para agregar/editar, rojo para eliminar. Componente Toast con Animated, 2s duración, sin librerías externas
- **Sin ORM**: Queries directas con expo-sqlite, params variadic
- **PRAGMAs separados**: Cada PRAGMA como execAsync individual
- **Singleton DB**: `getDatabase()` retorna siempre la misma instancia
- **Cards grid 2x2**: `FlatList numColumns={2}` con `maxWidth: '48.5%'`
