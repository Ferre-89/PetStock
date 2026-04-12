# PetStock - Documentación Técnica

App de gestión de inventario para pet shop.

## Stack

- React Native 0.81 + Expo SDK 54 (TypeScript)
- expo-sqlite 16 (SQLite local, API sincrónica)
- React Navigation 7 (bottom tabs + native stack)
- @expo/vector-icons (Ionicons)
- @react-native-async-storage/async-storage (persistencia clave-valor)
- xlsx + expo-file-system + expo-sharing (exportar Excel)
- expo-splash-screen + expo-navigation-bar (splash animada, edge-to-edge Android)
- react-native-safe-area-context (SafeAreaProvider)

## Estructura de Carpetas

```
/src
  /screens/           — Pantallas
    InventarioScreen    — Topbar blanca, grid 2 columnas, chips categoría, FAB, ProductoModal
    AlertasScreen       — Topbar blanca, secciones stock bajo + vencimientos
    ProveedoresScreen   — Lista proveedores accordion colapsable, selector inline de productos, FAB
    ConfigScreen        — Nombre negocio (AsyncStorage), exportar Excel (xlsx + expo-sharing), acerca de
  /components/        — Componentes reutilizables
    Toast               — Toast animado (Animated.View), 2s, sin librerías externas
    ProductoModal       — Modal unificado agregar/editar producto. KeyboardAvoidingView + ScrollView scrolleable. En modo edición: sección Proveedores con chips (nombre+precio), asociar/desasociar, y botón eliminar
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
4. **Config** — Nombre negocio, exportar inventario/proveedores a Excel, acerca de

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
| Otros | `#f1efe8` | 📦 |

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

## Configuración

- **Nombre del negocio**: guardado en AsyncStorage (`petstock_nombre_negocio`), usado solo como encabezado en archivos exportados. Topbar siempre muestra "PetStock" hardcodeado
- **Exportar inventario**: genera .xlsx con columnas Nombre, Marca, Categoría, Precio, Stock, Stock mínimo, Fecha vencimiento
- **Exportar proveedores**: genera .xlsx con columnas Proveedor, Teléfono, Email, Producto, Precio de costo
- Exportación usa `xlsx` para generar el archivo y `expo-sharing` para compartir (WhatsApp, email, Drive, etc.)
- Cada botón de exportar tiene loading independiente
- **Acerca de**: PetStock + versión 1.0.0

## EAS Build

- **Package / Bundle ID**: `com.roferreiradev.petstock` (Android e iOS)
- Perfiles en `eas.json`: `development` (dev client, internal), `preview` (APK, internal), `production`

## Splash Screen Animada

- `expo-splash-screen.preventAutoHideAsync()` mantiene splash nativa hasta que la app esté lista
- Overlay animado sobre la app con fondo `#1a1f2e`:
  - Logo `adaptive-icon.png` 120x120 con spring scale (0.3→1.0) + fade in (600ms)
  - Título "PetStock" y subtítulo "Gestión de inventario" con fade in (400ms, delay 300ms)
  - Espera 800ms adicionales, luego fade out (400ms) y se desmonta
- Android edge-to-edge: `expo-navigation-bar` con color `#1a1f2e`
- `SafeAreaProvider` wrappea toda la app en App.tsx
- Todas las pantallas usan `useSafeAreaInsets()` para `paddingTop` dinámico en topbar (no hardcodeado)
- Bottom tab bar respeta safe area de iOS automáticamente (sin height fija)

## Branding / Assets

- **Icon iOS**: `./assets/icon.png`
- **Icon Android**: `./assets/icon-android.png`
- **Adaptive icon**: `./assets/icon-android.png` (foreground) con fondo `#ffffff`
- **Splash nativo**: `./assets/splash-blank.png` (1x1 sólido `#1a1f2e`), resizeMode native — fondo liso sin logo para transición imperceptible al splash animado de RN
- **backgroundColor general**: `#1a1f2e`

## Decisiones de Arquitectura

- **API sincrónica**: expo-sqlite sync API para evitar NullPointerException en Expo Go Android
- **Sin variantes (MVP)**: Stock directo en producto
- **Todo via modales**: ProductoModal, ProveedorModal, ProveedorDetalleModal — sin pantallas separadas de detalle/agregar
- **Toasts de feedback**: Verde para agregar/editar, rojo para eliminar
- **Modal de confirmación custom**: Para eliminar (no Alert nativo — falla sobre Modal en Android)
- **Singleton DB**: `getDatabase()` retorna siempre la misma instancia
- **Cards grid 2x2**: Para productos. Lista vertical para proveedores.
