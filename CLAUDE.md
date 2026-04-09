# PetStock - Documentación Técnica

App de gestión de inventario para pet shop.

## Stack

- React Native 0.81 + Expo SDK 54 (TypeScript)
- expo-sqlite 16 (SQLite local, API sincrónica)
- React Navigation 7 (bottom tabs + native stack)
- @expo/vector-icons (Ionicons)

## Estructura de Carpetas

```
/src
  /screens/           — Pantallas
    InventarioScreen    — Topbar blanca, grid 2 columnas, chips categoría, FAB, ProductoModal
    AlertasScreen       — Topbar blanca, secciones stock bajo + vencimientos
    ProveedoresScreen   — Lista proveedores accordion colapsable, selector inline de productos, FAB
    ConfigScreen        — (placeholder)
  /components/        — Componentes reutilizables
    Toast               — Toast animado (Animated.View), 2s, sin librerías externas
    ProductoModal       — Modal unificado agregar/editar producto. En modo edición: sección Proveedores con chips (nombre+precio), asociar/desasociar, y botón eliminar
    ProveedorModal      — Modal unificado agregar/editar proveedor con confirmación de eliminación
  /constants/         — Constantes (categorías, colores)
  /database/          — Lógica SQLite (API sync)
    schema.ts           — Inicialización DB y tablas
    productos.ts        — CRUD productos
    proveedores.ts      — CRUD proveedores + asociación producto-proveedor
    movimientos.ts      — Registro de movimientos (sin UI)
    alertas.ts          — Queries alertas
  /navigation/        — Navegadores
    AppNavigator        — Bottom tabs (4 tabs)
    InventarioStack     — Stack: solo InventarioList
  /types/             — Tipos TypeScript
```

## Navegación

Bottom tabs con 4 tabs:
1. **Inventario** — Lista de productos. ABM via ProductoModal.
2. **Alertas** — Stock bajo y vencimientos próximos (badge dinámico)
3. **Proveedores** — Lista de proveedores. ABM via ProveedorModal. Detalle via ProveedorDetalleModal.
4. **Config** — (placeholder)

## Schema SQLite

Base de datos: `petstock.db`

```sql
productos (id, nombre, marca, categoria, precio, stock, stock_minimo, fecha_vencimiento, created_at)
movimientos (id, producto_id, tipo[entrada|salida|ajuste], cantidad, fecha, nota)
proveedores (id, nombre, telefono, email, notas, created_at)
producto_proveedor (id, producto_id, proveedor_id, precio_costo) — UNIQUE(producto_id, proveedor_id)
```

- API sincrónica (openDatabaseSync, execSync, runSync, getAllSync, getFirstSync)
- PRAGMAs: journal_mode WAL, foreign_keys ON
- ON DELETE CASCADE en todas las FK
- Migración automática de schema viejo al abrir

## Colores

| Uso | Color |
|-----|-------|
| Fondo topbar | `#fff` (blanco) |
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

- `stock`: campo directo en productos
- **OK**: stock > stock_minimo → badge verde
- **Bajo**: 0 < stock <= stock_minimo → badge amarillo
- **Crítico**: stock <= 0 → badge rojo
- Fecha de vencimiento: solo editable si categoría = comida

## Lógica de Alertas

- **Stock bajo**: producto con `stock <= stock_minimo`
- **Próximo a vencer**: producto con `fecha_vencimiento` dentro de 30 días y stock > 0
- **Badge topbar + tab**: dinámico vía `getTotalAlertas()`

## Proveedores

- CRUD completo: agregar, editar, eliminar proveedores
- Asociación producto-proveedor con precio de costo
- `producto_proveedor` con UNIQUE constraint para evitar duplicados
- Modal detalle muestra info del proveedor + lista de productos con precio de costo
- Selector de productos disponibles (excluye ya asociados) al asociar
- Cards accordion: colapsadas muestran nombre/teléfono/cantidad + flecha ▼. Expandidas muestran productos con emoji+precio+botón ✕
- Solo un accordion expandido a la vez
- Selector de productos inline dentro del accordion (sin modal separado)
- Relación bidireccional: desde ProductoModal se ven/agregan proveedores, desde accordion se ven/agregan productos

## Decisiones de Arquitectura

- **API sincrónica**: expo-sqlite sync API para evitar NullPointerException en Expo Go Android
- **Sin variantes (MVP)**: Stock directo en producto
- **Todo via modales**: ProductoModal, ProveedorModal, ProveedorDetalleModal — sin pantallas separadas de detalle/agregar
- **Toasts de feedback**: Verde para agregar/editar, rojo para eliminar
- **Modal de confirmación custom**: Para eliminar (no Alert nativo — falla sobre Modal en Android)
- **Singleton DB**: `getDatabase()` retorna siempre la misma instancia
- **Cards grid 2x2**: Para productos. Lista vertical para proveedores.
